import asyncio
from datetime import datetime, timedelta, timezone

import httpx
import jwt
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.config import settings
from app.core.security import verify_access_token
from app.main import app
from app.schemas.daily_log import DailyLogCreate


def request(method: str, path: str) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path)

    return asyncio.run(send())


def test_health_endpoint_is_available() -> None:
    response = request("GET", "/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_protected_endpoint_requires_authentication() -> None:
    response = request("GET", "/api/v1/profile")
    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication is required."


def test_missing_sleep_remains_distinct_from_zero() -> None:
    entry = DailyLogCreate(log_date="2026-10-11", steps=0)
    assert entry.steps == 0
    assert entry.sleep_duration_hours is None


def test_daily_log_rejects_invalid_sleep_quality() -> None:
    with pytest.raises(ValidationError):
        DailyLogCreate(log_date="2026-10-11", steps=1000, sleep_quality=6)


def test_access_token_signature_and_claims_are_verified(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(settings, "supabase_jwt_secret", "test-only-secret-with-at-least-32-bytes")
    claims = {
        "sub": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "aud": "authenticated",
        "iss": "https://example.supabase.co/auth/v1",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    token = jwt.encode(claims, "test-only-secret-with-at-least-32-bytes", algorithm="HS256")
    assert verify_access_token(token)["sub"] == claims["sub"]


def test_access_token_with_wrong_signature_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(settings, "supabase_jwt_secret", "expected-secret-with-at-least-32-bytes")
    claims = {
        "sub": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "aud": "authenticated",
        "iss": "https://example.supabase.co/auth/v1",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    token = jwt.encode(claims, "different-secret-with-at-least-32-bytes", algorithm="HS256")
    with pytest.raises(HTTPException) as error:
        verify_access_token(token)
    assert error.value.status_code == 401
