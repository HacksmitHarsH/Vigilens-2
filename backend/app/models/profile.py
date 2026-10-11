import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    step_goal: Mapped[int] = mapped_column(
        Integer, nullable=False, default=8000, server_default="8000"
    )
    sleep_goal_hours: Mapped[float] = mapped_column(
        Float, nullable=False, default=8, server_default="8"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    daily_logs: Mapped[list["DailyWellnessLog"]] = relationship(  # noqa: F821
        back_populates="profile", cascade="all, delete-orphan"
    )
    workouts: Mapped[list["Workout"]] = relationship(  # noqa: F821
        back_populates="profile", cascade="all, delete-orphan"
    )
