"""
Chat streaming endpoint.
- Accepts full conversation history as a JSON body (messages array).
- Persists user + assistant messages to PostgreSQL.
- Streams the AI response via SSE (text/event-stream).
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import get_or_create_db_user
from app.core.database import get_db
from app.models.schemas import Conversation, Message, User
from app.services.langchain_bedrock import stream_response

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str       # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]  # full history; last entry must be the new user message
    model_id: str = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
    conversation_id: Optional[str] = None




# ---------------------------------------------------------------------------
# Stream endpoint
# ---------------------------------------------------------------------------

@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    user: User = Depends(get_or_create_db_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts full conversation history, streams the AI response via SSE,
    and persists both user and assistant messages to the database.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages array cannot be empty.")

    new_user_message = request.messages[-1]
    if new_user_message.role != "user":
        raise HTTPException(status_code=400, detail="Last message in array must have role 'user'.")

    # ------------------------------------------------------------------
    # Resolve or create conversation
    # ------------------------------------------------------------------
    if request.conversation_id:
        try:
            conv_uuid = uuid.UUID(request.conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation_id format.")
        result = await db.execute(
            select(Conversation).where(Conversation.id == conv_uuid)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    else:
        raw = new_user_message.content[:60]
        title = raw + ("..." if len(new_user_message.content) > 60 else "")
        conversation = Conversation(user_id=user.id, title=title)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # Persist the user message
    db.add(Message(
        conversation_id=conversation.id,
        role="user",
        content=new_user_message.content,
        model_used=None,
    ))
    await db.commit()

    conv_id_str = str(conversation.id)
    history = [{"role": m.role, "content": m.content} for m in request.messages]

    # ------------------------------------------------------------------
    # SSE generator
    # ------------------------------------------------------------------
    async def sse_generator():
        accumulated = ""
        try:
            # Send conversation_id first so the frontend can update the sidebar
            # immediately without waiting for the full response.
            yield f"data: {json.dumps({'conversation_id': conv_id_str})}\n\n"

            async for chunk in stream_response(request.model_id, history):
                accumulated += chunk
                yield f"data: {json.dumps({'text': chunk})}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as exc:
            logger.error(f"Stream error [{request.model_id}]: {exc}")
            yield f"data: {json.dumps({'error': 'AI stream error. Please try again.'})}\n\n"
            accumulated = accumulated or f"[Stream error: {exc}]"

        finally:
            if accumulated:
                try:
                    db.add(Message(
                        conversation_id=conversation.id,
                        role="assistant",
                        content=accumulated,
                        model_used=request.model_id,
                    ))
                    await db.commit()
                except Exception as db_exc:
                    logger.error(f"Failed to persist assistant message: {db_exc}")

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


