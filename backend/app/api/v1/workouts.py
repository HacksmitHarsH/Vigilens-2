import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_profile
from app.db.session import get_db
from app.models.profile import Profile
from app.models.workout import Workout
from app.schemas.workout import WorkoutCreate, WorkoutRead, WorkoutUpdate

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.get("", response_model=list[WorkoutRead])
def list_workouts(
    profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)
) -> list[Workout]:
    query = (
        select(Workout).where(Workout.profile_id == profile.id).order_by(Workout.occurred_at.desc())
    )
    return list(db.scalars(query).all())


@router.post("", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED)
def create_workout(
    payload: WorkoutCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> Workout:
    workout = Workout(profile_id=profile.id, **payload.model_dump())
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout


def _owned_workout(workout_id: uuid.UUID, profile: Profile, db: Session) -> Workout:
    workout = db.scalar(
        select(Workout).where(Workout.id == workout_id, Workout.profile_id == profile.id)
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found.")
    return workout


@router.get("/{workout_id}", response_model=WorkoutRead)
def read_workout(
    workout_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> Workout:
    return _owned_workout(workout_id, profile, db)


@router.patch("/{workout_id}", response_model=WorkoutRead)
def update_workout(
    workout_id: uuid.UUID,
    changes: WorkoutUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> Workout:
    workout = _owned_workout(workout_id, profile, db)
    updates = changes.model_dump(exclude_unset=True)
    invalid = [
        field
        for field in ("activity_type", "duration_minutes", "intensity", "occurred_at")
        if field in updates and updates[field] is None
    ]
    if invalid:
        raise HTTPException(status_code=422, detail=f"{', '.join(invalid)} cannot be empty.")
    for field, value in updates.items():
        setattr(workout, field, value)
    db.commit()
    db.refresh(workout)
    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> Response:
    workout = _owned_workout(workout_id, profile, db)
    db.delete(workout)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
