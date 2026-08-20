from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from sqlalchemy.orm import Session
from app.models.property import Property
from app.core.config import settings
import re
from langchain_groq  import ChatGroq

# ---------- State ----------
class AgentState(TypedDict):
    messages: Annotated[List, "chat history"]
    properties_context: str

# ---------- LLM ----------
llm = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.7
)
# ---------- Helper: Format properties ----------
def get_properties_context(db: Session) -> str:
    properties = db.query(Property).filter(Property.is_active == True).limit(25).all()

    if not properties:
        return "There are currently no properties available in the inventory."

    context_lines = ["CURRENT AVAILABLE INVENTORY:\n"]

    for p in properties:
        price = f"${p.price:,.0f}" if p.price else "Price on request"
        size = f"{p.square_footage:,.0f} sqft" if p.square_footage else "Size not specified"
        cap = f"{p.cap_rate}%" if p.cap_rate else "N/A"

        context_lines.append(
            f"""Property ID: {p.id}
Title: {p.title}
Type: {p.property_type.title()}
Location: {p.address}, {p.city}, {p.state}
Price: {price}
Size: {size}
Cap Rate: {cap}
Status: {p.status}
Description: {p.description or 'No description provided'}
Features: {p.features or 'Not specified'}
---"""
        )

    return "\n".join(context_lines)

# ---------- Clean response (remove thinking tags) ----------
def clean_response(text: str) -> str:
    # Remove <think>...</think> blocks
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
    # Remove any leftover thinking markers
    text = re.sub(r"</?think>", "", text, flags=re.IGNORECASE)
    return text.strip()

# ---------- Agent Node ----------
def agent_node(state: AgentState):
    system_prompt = f"""You are a professional Commercial Real Estate AI Sales Agent for CRE AI Pro.

Your role:
- Help clients find suitable commercial properties
- Be clear, professional, and consultative
- Only use properties from the inventory below
- Never invent properties

Current Inventory:
{state['properties_context']}

Important Rules:
- Only output the final reply to the client.
- Do NOT output any thinking process, reasoning, or <think> tags.
- Keep responses concise and professional.
- Always include key details (Title, Location, Price, Size, Cap Rate) when recommending.
- Ask clarifying questions when helpful.
"""

    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    
    response = llm.invoke(messages)
    
    # Clean the response
    cleaned_content = clean_response(response.content)
    cleaned_message = AIMessage(content=cleaned_content)
    
    return {"messages": state["messages"] + [cleaned_message]}

# ---------- Build Graph ----------
def create_sales_agent():
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.set_entry_point("agent")
    workflow.add_edge("agent", END)
    return workflow.compile()

sales_agent = create_sales_agent()