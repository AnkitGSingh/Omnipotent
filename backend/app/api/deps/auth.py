from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import logging
import time
from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger(__name__)
security = HTTPBearer()

# ---------------------------------------------------------------------------
# JWKS Cache — avoids calling Clerk on every request.
# Refreshes every 5 minutes (300 s).
# ---------------------------------------------------------------------------
_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}
_JWKS_TTL: float = 300.0

# Derived from CLERK_PUBLISHABLE_KEY: pk_test_cnVsaW5nLWNyYXdkYWQtNDMuY2xlcmsuYWNjb3VudHMuZGV2JA
# decodes (base64) to: ruling-crawdad-43.clerk.accounts.dev
CLERK_JWKS_URL = "https://ruling-crawdad-43.clerk.accounts.dev/.well-known/jwks.json"


async def get_clerk_jwks() -> dict:
    """Fetch Clerk JWKS with a 5-minute TTL in-process cache."""
    now = time.monotonic()
    if _jwks_cache["keys"] is not None and (now - _jwks_cache["fetched_at"]) < _JWKS_TTL:
        return {"keys": _jwks_cache["keys"]}

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(
                CLERK_JWKS_URL,
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            )
            response.raise_for_status()
            data = response.json()
            _jwks_cache["keys"] = data.get("keys", [])
            _jwks_cache["fetched_at"] = now
            return data
        except Exception as exc:
            logger.error(f"Failed to fetch Clerk JWKS: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Auth configuration error — cannot reach Clerk JWKS endpoint.",
            )


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Verify the Clerk JWT and return the user's Clerk ID (sub claim)."""
    token = credentials.credentials
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        jwks = await get_clerk_jwks()
        clerk_key = next(
            (k for k in jwks.get("keys", []) if k.get("kid") == kid), None
        )
        if not clerk_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Public key not found for token kid.",
            )

        payload = jwt.decode(token, clerk_key, algorithms=["RS256"])
        return payload["sub"]

    except JWTError as exc:
        logger.warning(f"JWT verification failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_or_create_db_user(
    clerk_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Resolve Clerk ID to a DB User record, auto-creating on first sign-in."""
    # Lazy import to avoid circular dependency
    from app.models.schemas import User

    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(clerk_id=clerk_id, plan="FREE", monthly_tokens=0)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Legacy alias kept for profile router (already used get_current_user)
# ---------------------------------------------------------------------------
async def get_current_user(clerk_id: str = Depends(verify_token)) -> str:
    return clerk_id
