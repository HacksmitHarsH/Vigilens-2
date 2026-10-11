import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_profile
from app.db.session import get_db
from app.models.daily_log import DailyWellnessLog
from app.models.profile import Profile
from app.schemas.daily_log import DailyLogCreate, DailyLogRead, DailyLogUpdate

router = APIRouter(prefix="/wellness", tags=["daily wellness"])


@router.get("", response_model=list[DailyLogRead])
def list_logs(
    start_date: date | None = None,
    end_date: date | None = None,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> list[DailyWellnessLog]:
    query = select(DailyWellnessLog).where(DailyWellnessLog.profile_id == profile.id)
    if start_date:
        query = query.where(DailyWellnessLog.log_date >= start_date)
    if end_date:
        query = query.where(DailyWellnessLog.log_date <= end_date)
    return list(db.scalars(query.order_by(DailyWellnessLog.log_date.desc())).all())


@router.post("", response_model=DailyLogRead, status_code=status.HTTP_201_CREATED)
def create_log(
    payload: DailyLogCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> DailyWellnessLog:
    record = DailyWellnessLog(profile_id=profile.id, **payload.model_dump())
    db.add(record)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A wellness entry already exists for this date."
        ) from exc
    db.refresh(record)
    return record


def _owned_log(log_id: uuid.UUID, profile: Profile, db: Session) -> DailyWellnessLog:
    record = db.scalar(
        select(DailyWellnessLog).where(
            DailyWellnessLog.id == log_id, DailyWellnessLog.profile_id == profile.id
        )
    )
    if not record:
        raise HTTPException(status_code=404, detail="Wellness entry not found.")
    return record


@router.get("/{log_id}", response_model=DailyLogRead)
def read_log(
    log_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> DailyWellnessLog:
    return _owned_log(log_id, profile, db)


@router.patch("/{log_id}", response_model=DailyLogRead)
def update_log(
    log_id: uuid.UUID,
    changes: DailyLogUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> DailyWellnessLog:
    record = _owned_log(log_id, profile, db)
    updates = changes.model_dump(exclude_unset=True)
    invalid = [
        field for field in ("log_date", "steps") if field in updates and updates[field] is None
    ]
    if invalid:
        raise HTTPException(status_code=422, detail=f"{', '.join(invalid)} cannot be empty.")
    for field, value in updates.items():
        setattr(record, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A wellness entry already exists for this date."
        ) from exc
    db.refresh(record)
    return record


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> Response:
    record = _owned_log(log_id, profile, db)
    db.delete(record)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
