from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps.auth import get_current_user

router = APIRouter()

@router.post("/upload")
async def upload_markdown_profile(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Uploads a markdown file, splits it into chunks using LangChain text splitters,
    generates embeddings via AWS Bedrock Titan, and stores them in pgvector.
    """
    if not file.filename.endswith(".md"):
        return {"error": "Only Markdown (.md) files are supported"}
        
    content = await file.read()
    
    # 1. Decode bytes to string
    # 2. Use LangChain MarkdownTextSplitter to create chunks
    # 3. Use BedrockEmbeddings to vectorize chunks
    # 4. Save to `profile_chunks` pgvector table
    
    return {"status": "Not Implemented", "filename": file.filename, "chunks_processed": 0}
