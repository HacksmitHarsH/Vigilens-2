from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field

from app.schemas.common import ORMModel


class WorkoutFields(ORMModel):
    activity_type: str = Field(min_length=1, max_length=80)
    duration_minutes: int = Field(ge=1, le=1440)
    intensity: Literal["low", "moderate", "high"]
    occurred_at: datetime
    notes: str | None = Field(default=None, max_length=2000)


class WorkoutCreate(WorkoutFields):
    pass


class WorkoutUpdate(ORMModel):
    activity_type: str | None = Field(default=None, min_length=1, max_length=80)
    duration_minutes: int | None = Field(default=None, ge=1, le=1440)
    intensity: Literal["low", "moderate", "high"] | None = None
    occurred_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=2000)


class WorkoutRead(WorkoutFields):
    id: UUID
    created_at: datetime
    updated_at: datetime
