"""
Chat streaming endpoint with database persistence.
Saves both user and assistant messages to the conversations table.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import uuid

from app.core.database import get_db
from app.models.schemas import Conversation, Message, User
from app.services.langchain_bedrock import stream_bedrock_response

router = APIRouter()


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


@router.post("/stream")
async def chat_stream(
    message: str,
    conversation_id: str = None,
    model_id: str = "anthropic.claude-3-haiku-20240307-v1:0",
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts a user message, streams the AI response via SSE,
    and persists both messages to the database.
    """
    user = await get_or_create_test_user(db)

    # Create or fetch the conversation
    if conversation_id:
        try:
            conv_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation ID")
        result = await db.execute(
            select(Conversation).where(Conversation.id == conv_uuid)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Auto-create a new conversation titled with the first few words
        title = message[:50] + ("..." if len(message) > 50 else "")
        conversation = Conversation(user_id=user.id, title=title)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # Save the user message to DB
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=message,
        model_used=None,
    )
    db.add(user_msg)
    await db.commit()

    # We need to collect the full AI response for DB persistence
    # but also stream it to the client in real-time
    conv_id_str = str(conversation.id)

    async def sse_generator():
        accumulated_response = ""
        try:
            async for chunk in stream_bedrock_response(model_id, message):
                accumulated_response += chunk
                data = json.dumps({"text": chunk})
                yield f"data: {data}\n\n"

            yield f"data: {json.dumps({'conversation_id': conv_id_str})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"data: {error_data}\n\n"
            accumulated_response = f"[Error: {str(e)}]"
        finally:
            # Persist the assistant's full response after streaming is done
            async with db.begin():
                assistant_msg = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=accumulated_response,
                    model_used=model_id,
                )
                db.add(assistant_msg)

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

