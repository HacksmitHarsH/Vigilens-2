from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient, PyJWKClientConnectionError, PyJWKClientError

from app.core.config import settings

bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    return PyJWKClient(f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json")


def verify_access_token(token: str) -> dict[str, Any]:
    if not settings.supabase_url:
        raise HTTPException(status_code=503, detail="Supabase authentication is not configured.")
    issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1"
    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")
        if algorithm == "HS256" and settings.supabase_jwt_secret:
            key = settings.supabase_jwt_secret
            algorithms = ["HS256"]
        elif algorithm in {"ES256", "RS256"}:
            key = _jwks_client().get_signing_key_from_jwt(token).key
            algorithms = [algorithm]
        else:
            raise InvalidTokenError("Unsupported signing algorithm")
        claims = jwt.decode(
            token,
            key,
            algorithms=algorithms,
            audience="authenticated",
            issuer=issuer,
            options={"require": ["exp", "sub", "aud", "iss"]},
        )
        return claims
    except HTTPException:
        raise
    except PyJWKClientConnectionError as exc:
        raise HTTPException(
            status_code=503, detail="Could not verify the Supabase access token."
        ) from exc
    except (InvalidTokenError, PyJWKClientError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail="Could not verify the Supabase access token."
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_access_token(credentials.credentials)
