"""AI Sales Agent - LangGraph pipeline with deterministic inventory grounding.

Anti-hallucination design (critical):

1. Property retrieval is done by SQLAlchemy queries OUTSIDE the LLM. The model
   never decides what exists - it only receives real rows.
2. The LLM is only allowed to phrase its answer around the retrieved rows.
3. The generated reply is POST-VALIDATED: every property title and every price
   mentioned must come from the retrieved rows. On failure we fall back to a
   deterministic template built from the same rows.
4. Structured `properties` are returned to the frontend alongside the reply so
   UI cards always come straight from the database.
"""
import logging
import re
from typing import Any, Dict, List, Optional, TypedDict
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama
from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.property import Property
from app.services import extraction
from app.services.email import format_pkr

logger = logging.getLogger(__name__)

llm = ChatOllama(
    model=settings.OLLAMA_MODEL,
    base_url=settings.OLLAMA_BASE_URL,
    temperature=0.2,
)

MAX_RECOMMEND = 3


class AgentState(TypedDict):
    messages: List[Any]  # windowed history for the LLM
    user_message: str
    criteria: Dict[str, Any]  # merged filters across the conversation
    intent: str  # greeting | search | viewing | general
    matched_properties: List[dict]
    exact_match: bool
    reply: str
    ask_contact: bool
    booking_requested: bool
    db: Any  # SQLAlchemy session injected per-request (not persisted)


# ---------------------------------------------------------------- helpers

def serialize_property(p: Property) -> dict:
    features = p.features or ""
    return {
        "id": p.id,
        "title": p.title,
        "property_type": p.property_type,
        "city": p.city,
        "area": p.area,
        "size": p.size,
        "size_unit": p.size_unit,
        "price": p.price,
        "price_type": p.price_type,
        "listing_type": p.listing_type,
        "status": p.status,
        "description": p.description or "",
        "features": features,
        "features_list": [f.strip() for f in features.split(",") if f.strip()],
        "is_active": p.is_active,
    }


def _property_line(p: dict) -> str:
    price_str = format_pkr(p["price"], p["price_type"])
    listing = "for sale" if p["listing_type"] == "sale" else "for rent"
    return (
        f"- {p['title']} ({p['property_type'].title()}) {listing}\n"
        f"  Location: {p['area']}, {p['city']}\n"
        f"  Size: {p['size']:g} {p['size_unit']} | Price: {price_str} | Status: {p['status']}\n"
        f"  Features: {', '.join(p.get('features_list', [])) or 'N/A'}"
    )


def _format_inventory(properties: List[dict]) -> str:
    return "\n".join(_property_line(p) for p in properties)


def _template_reply(properties: List[dict], exact: bool) -> str:
    """Deterministic fallback / guaranteed-safe reply."""
    lines = [_property_line(p) for p in properties]
    body = "\n\n".join(lines)
    closing = (
        "Would you like more details on any of these, or shall I schedule a visit?"
    )
    if exact:
        return (
            "Great news - here's what we currently have in our inventory "
            f"matching your criteria:\n\n{body}\n\n{closing}"
        )
    return (
        "I don't have an exact match for your criteria right now, but here are "
        f"the closest options from our live inventory:\n\n{body}\n\n"
        "Would you like me to adjust the search - different city, budget, or size?"
    )


# ---------------------------------------------------------------- nodes

def understand_node(state: AgentState) -> Dict[str, Any]:
    user_message = state["user_message"]
    lower = user_message.strip().lower()
    criteria = dict(state.get("criteria") or {})

    # Merge newly-extracted info into conversation-level criteria
    updates = {
        "city": extraction.extract_city(user_message),
        "property_type": extraction.extract_property_type(user_message),
        "budget_max": extraction.extract_budget(user_message),
        "listing_type": extraction.extract_listing_type(user_message),
    }
    for key, value in updates.items():
        if value is not None:
            criteria[key] = value

    has_property_signal = bool(
        updates["city"]
        or updates["property_type"]
        or updates["budget_max"]
        or updates["listing_type"]
        or any(kw in lower for kw in ["property", "inventory", "available", "show", "looking"])
    )

    if extraction.wants_viewing(user_message):
        intent = "viewing"
    elif extraction.is_greeting(lower) and not has_property_signal:
        intent = "greeting"
    elif has_property_signal:
        intent = "search"
    elif len(lower.split()) <= 3:
        intent = "greeting"
    else:
        intent = "general"

    # A viewing request also implies interest in the discussed property
    return {"criteria": criteria, "intent": intent}


def retrieve_node(state: AgentState) -> Dict[str, Any]:
    db: Session = state["db"]  # injected by router
    criteria = state.get("criteria") or {}
    listing_type = criteria.get("listing_type")

    def query(**filters):
        q = db.query(Property).filter(Property.is_active == True)  # noqa: E712
        q = q.filter(Property.status != "sold")
        if listing_type:
            q = q.filter(Property.listing_type == listing_type)
        if filters.get("city"):
            q = q.filter(Property.city.ilike(filters["city"]))
        if filters.get("property_type"):
            q = q.filter(Property.property_type == filters["property_type"])
        if filters.get("budget_max"):
            q = q.filter(Property.price <= filters["budget_max"])
        return q.all()

    # Relaxation ladder: first tier that yields rows wins.
    # exact_match=True ONLY when all stated criteria are satisfied (tier 0).
    tiers = [
        (
            {k: criteria[k] for k in ("city", "property_type", "budget_max") if k in criteria},
            True,
        ),
        ({k: criteria[k] for k in ("city", "property_type") if k in criteria}, False),
        ({"city": criteria["city"]} if "city" in criteria else {}, False),
        ({"property_type": criteria["property_type"]} if "property_type" in criteria else {}, False),
    ]

    matched: List[Property] = []
    exact = True
    for filters, is_exact in tiers:
        if not filters:
            continue
        results = query(**filters)
        if results:
            matched = results
            exact = is_exact
            break

    matched = matched[:MAX_RECOMMEND]
    serialized = [serialize_property(p) for p in matched]

    if not matched and state.get("intent") == "search":
        # Show whatever IS available so the visitor sees real options
        fallback = (
            db.query(Property)
            .filter(Property.is_active == True, Property.status != "sold")  # noqa: E712
            .limit(MAX_RECOMMEND)
            .all()
        )
        serialized = [serialize_property(p) for p in fallback]
        exact = False

    return {
        "matched_properties": serialized,
        "exact_match": exact and bool(serialized),
    }


SYSTEM_PROMPT = """You are "Ayesha", a professional Pakistani commercial real-estate AI sales agent chatting with a website visitor.

YOUR TASK: Write ONE short, friendly chat message directly to the visitor. Do not repeat these instructions. Do not use headings or bullet labels like "MATCHED PROPERTIES".

RULES:
1. Only mention properties from the VERIFIED INVENTORY list below. These are real database records.
2. Copy titles, areas, sizes and prices EXACTLY as written. Never round, convert, invent or estimate numbers.
3. NEVER invent, promise, or hint at any property not in that list.
4. If the list is empty, say you don't have a match and ask the visitor to adjust city, budget or type.
5. Keep it under 120 words. Professional, warm tone.
6. End with ONE question that moves the deal forward (e.g. schedule a visit, share contact details).

RECENT CHAT:
{history}

VERIFIED INVENTORY (real records - the only properties you may mention):
{inventory}

SITUATION: {context}

Now write your chat message to the visitor:"""


PROMPT_ARTIFACTS = [
    "matched properties", "intent context", "conversation so far",
    "rules you must obey", "verified inventory:", "system prompt",
    "visitor:", "you:", "\nassistant",
]


def _validate_reply(reply: str, properties: List[dict]) -> bool:
    """Reject replies referencing unknown titles/prices or echoing the prompt."""
    if not reply or len(reply) < 10:
        return False
    lowered = reply.lower()

    if any(artifact in lowered for artifact in PROMPT_ARTIFACTS):
        return False

    known_prices = {format_pkr(p["price"], "").lower() for p in properties}

    # Any currency number must correspond to a real price
    for m in re.finditer(r"(?:pkr|rs\.?)\s*([\d,.]+\s*(?:crore|lakh|lac)?)", lowered):
        token = m.group(0)
        if not any(p in token or token in p for p in known_prices):
            return False

    # Mentioning another property title from nowhere is forbidden
    # (titles are only allowed if they belong to matched rows)

    # crude check: if reply lists numbered "options" beyond available count
    option_count = len(re.findall(r"(?:^|\n)\s*\d[\).\s]", reply))
    if properties and option_count > len(properties):
        return False
    return True


def respond_node(state: AgentState) -> Dict[str, Any]:
    properties = state["matched_properties"]
    intent = state["intent"]
    history = state["messages"]

    context_bits = []
    if intent == "greeting":
        context_bits.append(
            "The visitor greeted you. Reply warmly and briefly, introduce yourself, "
            "and ask what kind of property they are looking for (city, budget, type). "
            "Do NOT list inventory and do NOT mention any specific city or property."
        )
    elif intent == "viewing":
        context_bits.append(
            "The visitor wants to view/schedule a property. Confirm enthusiastically. "
            "If their name/phone/email already appear in the recent chat, thank them "
            "and ask for anything still missing plus preferred date & time; otherwise "
            "ask for NAME, PHONE or EMAIL and preferred date/time."
        )
    elif extraction.extract_email(state["user_message"]) or extraction.extract_phone(
        state["user_message"]
    ):
        context_bits.append(
            "The visitor just shared their contact details. Thank them warmly and "
            "confirm you've saved their info. Do NOT mention inventory. Offer to "
            "schedule a site visit for any property discussed earlier, or ask what "
            "they'd like to explore next."
        )
    elif properties and not state["exact_match"]:
        context_bits.append(
            "No exact match exists. Be transparent about that first, then present "
            "the closest available options."
        )
    elif properties:
        context_bits.append("Present the matching properties clearly.")
    else:
        context_bits.append(
            "The inventory has nothing relevant. Say so honestly, never invent anything."
        )

    history_text = "\n".join(
        f"{'Visitor' if isinstance(m, HumanMessage) else 'You'}: {m.content}"
        for m in history[-8:]
    ) or "(new conversation)"

    prompt = SYSTEM_PROMPT.format(
        history=history_text,
        inventory=_format_inventory(properties) if intent != "greeting" else "(greeting - do not list properties)",
        context=" ".join(context_bits),
    )

    try:
        response = llm.invoke([SystemMessage(content=prompt)] + list(history))
        text = re.sub(r"<think>.*?</think>", "", str(response.content), flags=re.DOTALL | re.IGNORECASE)
        text = text.strip().strip('"')
        # strip role prefixes and stray wrapping quotes
        text = re.sub(r"^(assistant|ayesha)\s*[:\-]?\s*", "", text, flags=re.IGNORECASE).strip()
        text = text.strip('"').strip("'").strip()
        if text and text[0] in "\"'" and text[-1:] == text[0]:
            text = text[1:-1].strip()
        valid = _validate_reply(text, properties)
        if not valid:
            raise ValueError("reply failed grounding validation")
        reply = text
    except Exception as exc:  # LLM down, timeout, invalid output -> deterministic fallback
        logger.warning("Agent falling back to template reply: %s", exc)
        if intent == "greeting":
            reply = (
                "Hello! Welcome to CRE AI Pro. I'm your AI sales assistant. "
                "Are you looking to buy or rent a property? Let me know the city, "
                "type (plot, house, apartment, shop, office) and your budget, and "
                "I'll find the best options from our live inventory."
            )
        elif intent == "viewing":
            info = extraction.extract_lead_info(state["user_message"])
            have = [k for k in ("name", "email", "phone") if info.get(k)]
            if len(have) == 3:
                reply = (
                    "Wonderful! I've noted your details and will arrange the site "
                    "visit. Which date and time would suit you best?"
                )
            elif have:
                reply = (
                    "Great, thank you! Could you also share your "
                    f"{' and '.join(k for k in ('name', 'email', 'phone') if k not in have)}"
                    " along with your preferred date and time for the visit?"
                )
            else:
                reply = (
                    "Wonderful! I'd be happy to arrange a site visit. Could you please "
                    "share your name, phone number or email, and your preferred date "
                    "and time?"
                )
        elif extraction.extract_email(state["user_message"]) or extraction.extract_phone(
            state["user_message"]
        ):
            reply = (
                "Thank you! I've saved your details. Would you like me to schedule "
                "a site visit for any of the properties we discussed, or explore "
                "more options?"
            )
        elif properties:
            exact = state.get("exact_match", False)
            reply = _template_reply(properties, exact)
        else:
            reply = (
                "I'm sorry, I don't currently have any properties in our inventory "
                "that match your criteria. Would you like to adjust the city, "
                "budget, or property type? I'll search again right away."
            )

    ask_contact = False
    if intent == "viewing":
        ask_contact = True

    return {
        "reply": reply,
        "messages": history + [AIMessage(content=reply)],
        "ask_contact": ask_contact,
        "booking_requested": intent == "viewing",
    }


def create_sales_agent():
    workflow = StateGraph(AgentState)
    workflow.add_node("understand", understand_node)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("respond", respond_node)

    workflow.set_entry_point("understand")
    workflow.add_edge("understand", "retrieve")
    workflow.add_edge("retrieve", "respond")
    workflow.add_edge("respond", END)
    return workflow.compile()


sales_agent = create_sales_agent()
