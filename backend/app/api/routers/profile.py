from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps.auth import get_or_create_db_user
from app.models.schemas import User, PLAN_LIMITS

router = APIRouter()


@router.get("/usage")
async def get_usage(
    user: User = Depends(get_or_create_db_user),
):
    """Return current token usage, plan limits, and reset timestamp."""
    plan = user.plan or "FREE"
    limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["FREE"])
    return {
        "plan": plan,
        "tokens_used": user.monthly_tokens or 0,
        "tokens_limit": limit,
        "resets_at": user.tokens_reset_at.isoformat() if user.tokens_reset_at else None,
    }


@router.post("/upload")
async def upload_markdown_profile(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_or_create_db_user),
):
    """
    Uploads a markdown file, splits it into chunks using LangChain text splitters,
    generates embeddings via AWS Bedrock Titan, and stores them in pgvector.
    """
    if not file.filename or not file.filename.endswith(".md"):
        return {"error": "Only Markdown (.md) files are supported"}

    content = await file.read()

    # 1. Decode bytes to string
    # 2. Use LangChain MarkdownTextSplitter to create chunks
    # 3. Use BedrockEmbeddings to vectorize chunks
    # 4. Save to `profile_chunks` pgvector table

    return {"status": "Not Implemented", "filename": file.filename, "chunks_processed": 0}
