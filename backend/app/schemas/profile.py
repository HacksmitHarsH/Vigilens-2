from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ORMModel


class ProfileUpdate(ORMModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    height_cm: float | None = Field(default=None, ge=50, le=260)
    weight_kg: float | None = Field(default=None, ge=10, le=500)
    step_goal: int | None = Field(default=None, ge=500, le=100000)
    sleep_goal_hours: float | None = Field(default=None, ge=1, le=16)


class ProfileRead(ORMModel):
    id: UUID
    display_name: str
    height_cm: float | None
    weight_kg: float | None
    step_goal: int
    sleep_goal_hours: float
    created_at: datetime
    updated_at: datetime
