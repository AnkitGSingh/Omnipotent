from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Clerk RS256 signing keys URL
CLERK_JWKS_URL = f"https://api.clerk.dev/v1/jwks"

async def get_clerk_jwks():
    """Fetch JSON Web Key Set from Clerk to verify JWT signatures."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                CLERK_JWKS_URL,
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch Clerk JWKS: {e}")
            raise HTTPException(status_code=500, detail="Internal Auth Configuration Error")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract and verify the Clerk JWT from the Authorization header."""
    token = credentials.credentials
    try:
        # First, decode the unverified header to get the Key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        # Get the JWKS from Clerk
        jwks = await get_clerk_jwks()
        
        # Find the matching key
        clerk_key = None
        for key in jwks.get('keys', []):
            if key.get('kid') == kid:
                clerk_key = key
                break
                
        if not clerk_key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Public key not found")

        # Verify the token
        payload = jwt.decode(
            token,
            clerk_key,
            algorithms=["RS256"],
            # audience=settings.clerk_publishable_key, # Can add aud verification if needed
        )
        
        # Return the sub (which is the user's Clerk ID)
        return payload.get("sub")
        
    except JWTError as e:
        logger.error(f"JWT Verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(clerk_id: str = Depends(verify_token)):
    """Dependency to inject the current authenticated user's ID into route handlers."""
    # In a real app we would lookup the User model in the DB using this clerk_id
    # For now, just return the ID to prove auth works
    return clerk_id
