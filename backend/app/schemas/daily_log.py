from datetime import date, datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ORMModel


class DailyLogBase(ORMModel):
    log_date: date
    steps: int = Field(ge=0, le=200000)
    resting_heart_rate: int | None = Field(default=None, ge=30, le=240)
    sleep_duration_hours: float | None = Field(default=None, ge=0, le=24)
    sleep_quality: int | None = Field(default=None, ge=1, le=5)
    note: str | None = Field(default=None, max_length=2000)


class DailyLogCreate(DailyLogBase):
    pass


class DailyLogUpdate(ORMModel):
    log_date: date | None = None
    steps: int | None = Field(default=None, ge=0, le=200000)
    resting_heart_rate: int | None = Field(default=None, ge=30, le=240)
    sleep_duration_hours: float | None = Field(default=None, ge=0, le=24)
    sleep_quality: int | None = Field(default=None, ge=1, le=5)
    note: str | None = Field(default=None, max_length=2000)


class DailyLogRead(DailyLogBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
