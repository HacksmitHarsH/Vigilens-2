from typing import Any

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.profile import Profile
from app.services.profiles import get_or_create_profile


def get_current_profile(
    claims: dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)
) -> Profile:
    return get_or_create_profile(db, claims)
