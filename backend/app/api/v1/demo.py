from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_profile
from app.core.config import settings
from app.db.session import get_db
from app.models.daily_log import DailyWellnessLog
from app.models.profile import Profile

router = APIRouter(prefix="/demo", tags=["development demo"])


@router.post("/seed")
def seed_demo_records(
    profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)
) -> dict[str, int | str]:
    if settings.app_env.lower() != "development":
        raise HTTPException(status_code=404, detail="Not found.")
    today = date.today()
    existing = set(
        db.scalars(
            select(DailyWellnessLog.log_date).where(
                DailyWellnessLog.profile_id == profile.id,
                DailyWellnessLog.log_date >= today - timedelta(days=6),
                DailyWellnessLog.log_date <= today,
            )
        ).all()
    )
    inserted = 0
    for offset in range(7):
        day = today - timedelta(days=6 - offset)
        if day in existing:
            continue
        db.add(
            DailyWellnessLog(
                profile_id=profile.id,
                log_date=day,
                steps=5600 + ((offset * 719) % 5600),
                resting_heart_rate=62 + offset % 8,
                sleep_duration_hours=6.5 + ((offset * 7) % 16) / 10,
                sleep_quality=3 + offset % 3,
                note="Synthetic development demo data",
            )
        )
        inserted += 1
    db.commit()
    return {
        "message": "Synthetic demo data added where dates were empty.",
        "records_created": inserted,
    }
