from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_profile
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.profile import ProfileRead, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileRead)
def read_profile(profile: Profile = Depends(get_current_profile)) -> Profile:
    return profile


@router.put("", response_model=ProfileRead)
def update_profile(
    changes: ProfileUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> Profile:
    updates = changes.model_dump(exclude_unset=True)
    invalid = [
        field
        for field in ("display_name", "step_goal", "sleep_goal_hours")
        if field in updates and updates[field] is None
    ]
    if invalid:
        raise HTTPException(status_code=422, detail=f"{', '.join(invalid)} cannot be empty.")
    for field, value in updates.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
