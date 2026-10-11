import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.profile import Profile


def get_or_create_profile(db: Session, claims: dict[str, Any]) -> Profile:
    user_id = uuid.UUID(claims["sub"])
    profile = db.get(Profile, user_id)
    if profile:
        return profile
    metadata = claims.get("user_metadata") or {}
    email = claims.get("email") or ""
    display_name = (
        metadata.get("display_name")
        or metadata.get("full_name")
        or email.split("@")[0]
        or "Vigilens user"
    )
    profile = Profile(id=user_id, display_name=str(display_name)[:120])
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
