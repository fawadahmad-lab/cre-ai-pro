import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.sales_agent import sales_agent
from app.db.session import get_db
from app.models.conversation import Conversation, Message
from app.models.lead import Lead
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.property import PropertyResponse
from app.services.email import send_lead_followup, format_pkr
from app.services.extraction import extract_lead_info
from app.services.scoring import calculate_lead_score

logger = logging.getLogger(__name__)
router = APIRouter()

HISTORY_WINDOW = 12  # messages sent to the LLM


def _load_history(db: Session, conversation_id: str):
    """Load recent history as LangChain messages (windowed)."""
    from langchain_core.messages import AIMessage, HumanMessage

    rows = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )
    window = rows[-HISTORY_WINDOW:]
    messages = []
    for row in window:
        cls = HumanMessage if row.role == "user" else AIMessage
        messages.append(cls(content=row.content))
    return messages, len(rows)


def _upsert_lead(db: Session, conversation_id: str, info: dict, viewing: bool) -> Lead:
    lead = (
        db.query(Lead)
        .filter(Lead.source == "chat", Lead.conversation_id == conversation_id)
        .first()
    )

    notes_markers = []
    if viewing:
        notes_markers.append("viewing requested")

    if not lead:
        has_any = any(info.values())
        if not has_any and not viewing:
            return None
        lead = Lead(
            conversation_id=conversation_id,
            source="chat",
            status="new",
        )
        db.add(lead)

    if info.get("name"):
        lead.name = info["name"]
    if info.get("email"):
        if not lead.email:
            notes_markers.append("contact details shared")
        lead.email = info["email"]
    if info.get("phone"):
        if not lead.phone:
            notes_markers.append("contact details shared")
        lead.phone = info["phone"]
    if info.get("city"):
        lead.city = info["city"]
    if info.get("property_type"):
        lead.property_type = info["property_type"]
    if info.get("budget"):
        lead.budget = info["budget"]

    if notes_markers:
        existing = lead.notes or ""
        for marker in notes_markers:
            if marker not in existing:
                existing = f"{marker}; {existing}".strip("; ")
        lead.notes = existing

    # First contact captured -> follow-up email with real inventory
    new_email = bool(info.get("email")) and lead.status == "new"
    lead.score = calculate_lead_score(lead)
    db.commit()
    db.refresh(lead)

    if new_email and lead.email:
        try:
            from app.models.property import Property

            q = db.query(Property).filter(
                Property.is_active == True, Property.status != "sold"  # noqa: E712
            )
            if lead.city:
                q = q.filter(Property.city.ilike(lead.city))
            if lead.property_type:
                q = q.filter(Property.property_type == lead.property_type)
            rows = q.limit(4).all() or (
                db.query(Property)
                .filter(Property.is_active == True)  # noqa: E712
                .limit(4)
                .all()
            )
            matched = [
                {
                    "title": p.title,
                    "location": f"{p.area}, {p.city}",
                    "price": format_pkr(p.price, "total"),
                }
                for p in rows
            ]
            send_lead_followup(to_email=lead.email, name=lead.name or "", matched_properties=matched)
        except Exception as exc:
            logger.warning("Follow-up email failed: %s", exc)

    return lead


@router.post("/", response_model=ChatResponse)
def chat_with_agent(request: ChatRequest, db: Session = Depends(get_db)):
    message = (request.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conversation_id = request.conversation_id or str(uuid.uuid4())

    conversation = db.get(Conversation, conversation_id)
    if not conversation:
        conversation = Conversation(
            id=conversation_id,
            title=message[:80],
        )
        db.add(conversation)

    history, total_messages = _load_history(db, conversation_id)

    # Persist the user's message first
    db.add(Message(conversation_id=conversation_id, role="user", content=message))
    db.commit()

    # Seed retrieval criteria with everything we already know about this
    # visitor (from earlier turns) plus what the current message adds, so
    # multi-turn searches stay coherent ("office in Lahore" -> "cheaper?").
    from app.services.extraction import extract_listing_type

    seed_criteria: dict = {}
    previous_lead = (
        db.query(Lead)
        .filter(Lead.source == "chat", Lead.conversation_id == conversation_id)
        .first()
    )
    if previous_lead:
        if previous_lead.city:
            seed_criteria["city"] = previous_lead.city
        if previous_lead.property_type:
            seed_criteria["property_type"] = previous_lead.property_type
        if previous_lead.budget:
            seed_criteria["budget_max"] = previous_lead.budget

    fresh_info = extract_lead_info(message)
    listing = extract_listing_type(message)
    if fresh_info.get("city"):
        seed_criteria["city"] = fresh_info["city"]
    if fresh_info.get("property_type"):
        seed_criteria["property_type"] = fresh_info["property_type"]
    if fresh_info.get("budget"):
        seed_criteria["budget_max"] = fresh_info["budget"]
    if listing:
        seed_criteria["listing_type"] = listing

    result = sales_agent.invoke(
        {
            "messages": history,
            "user_message": message,
            "criteria": seed_criteria,
            "intent": "general",
            "matched_properties": [],
            "exact_match": False,
            "reply": "",
            "ask_contact": False,
            "booking_requested": False,
            "db": db,
        }
    )

    reply = result["reply"]
    db.add(Message(conversation_id=conversation_id, role="assistant", content=reply))

    # ---- Lead capture & linking ----
    info = extract_lead_info(message)
    lead = _upsert_lead(db, conversation_id, info, viewing=result.get("booking_requested", False))
    conversation.lead_id = lead.id if lead else conversation.lead_id
    db.commit()

    # If a viewing was requested and we know the property + contact, the router
    # does NOT auto-book; the frontend offers a one-click booking dialog with
    # pre-filled data. This keeps bookings intentional and reliable.

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
        properties=[PropertyResponse.model_validate(p) for p in result["matched_properties"]],
        lead_id=lead.id if lead else None,
    )
