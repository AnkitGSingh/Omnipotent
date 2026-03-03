from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import chat, profile, conversations

app = FastAPI(
    title="OmniChat API",
    description="Backend API for the OmniChat multi-model AI platform",
    version="1.0.0"
)

# Configure CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://omnipotent-flax.vercel.app",
        "https://omnipotent-git-main-ankitgsinghs-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Healthcheck
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "omnichat-api"}

# Include Routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
# app.include_router(auth.router, prefix="/api/auth", tags=["auth"])  # Deferred

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
