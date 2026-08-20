from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage, AIMessage

from app.db.session import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.agents.sales_agent import sales_agent, get_properties_context

router = APIRouter()

# Simple in-memory conversation store (for demo only)
conversations = {}

@router.post("/", response_model=ChatResponse)
def chat_with_agent(request: ChatRequest, db: Session = Depends(get_db)):
    conversation_id = request.conversation_id or "default"
    
    # Get or create conversation history
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    # Add user message
    conversations[conversation_id].append(HumanMessage(content=request.message))
    
    # Get current properties context
    properties_context = get_properties_context(db)
    
    # Run the agent
    result = sales_agent.invoke({
        "messages": conversations[conversation_id],
        "properties_context": properties_context
    })
    
    # Get the latest AI reply
    ai_reply = result["messages"][-1].content
    
    # Save AI reply to history
    conversations[conversation_id].append(AIMessage(content=ai_reply))
    
    return ChatResponse(
        reply=ai_reply,
        conversation_id=conversation_id
    )