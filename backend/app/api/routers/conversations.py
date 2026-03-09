"""
Conversation CRUD endpoints.
Handles creating, listing, and retrieving conversations and their messages.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid

from app.core.database import get_db
from app.api.deps.auth import get_or_create_db_user
from app.models.schemas import User, Conversation, Message

router = APIRouter()


@router.get("/")
async def list_conversations(
    user: User = Depends(get_or_create_db_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for the authenticated user, newest first."""
    
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
    user: User = Depends(get_or_create_db_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation and return its ID."""
    
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
    user: User = Depends(get_or_create_db_user),
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
    if conversation.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

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
    user: User = Depends(get_or_create_db_user),
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
    if conversation.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    conversation.title = title
    await db.commit()
    
    return {"id": str(conversation.id), "title": conversation.title}


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_or_create_db_user),
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
    if conversation.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    await db.delete(conversation)
    await db.commit()
    
    return {"status": "success", "message": "Conversation deleted"}
