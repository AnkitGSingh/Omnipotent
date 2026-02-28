"""
Conversation CRUD endpoints.
Handles creating, listing, and retrieving conversations and their messages.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
import uuid

from app.core.database import get_db
from app.models.schemas import User, Conversation, Message

router = APIRouter()

# --- Helper: Get or create a default test user (no auth yet) ---
async def get_or_create_test_user(db: AsyncSession) -> User:
    """Until Clerk auth is wired, we use a single test user."""
    test_clerk_id = "test_user_local"
    result = await db.execute(
        select(User).where(User.clerk_id == test_clerk_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(clerk_id=test_clerk_id, current_tier="Free")
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    return user


@router.get("/")
async def list_conversations(db: AsyncSession = Depends(get_db)):
    """List all conversations for the test user, newest first."""
    user = await get_or_create_test_user(db)
    
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()
    
    return {
        "conversations": [
            {
                "id": str(c.id),
                "title": c.title or "New Chat",
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in conversations
        ]
    }


@router.post("/")
async def create_conversation(
    title: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation and return its ID."""
    user = await get_or_create_test_user(db)
    
    conversation = Conversation(
        user_id=user.id,
        title=title or "New Chat",
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    
    return {
        "id": str(conversation.id),
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat() if conversation.created_at else None,
    }


@router.get("/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Load all messages for a given conversation, ordered chronologically."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")
    
    # Verify conversation exists
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_uuid)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Fetch messages
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_uuid)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    
    return {
        "conversation_id": conversation_id,
        "title": conversation.title,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "model_used": m.model_used,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.patch("/{conversation_id}")
async def update_conversation_title(
    conversation_id: str,
    title: str,
    db: AsyncSession = Depends(get_db),
):
    """Update the title of a conversation."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")
    
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_uuid)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = title
    await db.commit()
    
    return {"id": str(conversation.id), "title": conversation.title}


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")
    
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_uuid)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    await db.delete(conversation)
    await db.commit()
    
    return {"status": "success", "message": "Conversation deleted"}
