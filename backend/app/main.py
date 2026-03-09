from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routers import chat, profile, conversations


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate required env vars at startup; fail loudly if missing."""
    settings.validate_required()
    yield


app = FastAPI(
    title="OmniChat API",
    description="Backend API for the OmniChat multi-model AI platform",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

# CORS — origins loaded from .env so local and production never conflict
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "omnichat-api"}


app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
