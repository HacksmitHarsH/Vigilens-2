import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Workout(Base):
    __tablename__ = "workouts"
    __table_args__ = (
        CheckConstraint("intensity IN ('low', 'moderate', 'high')", name="ck_workouts_intensity"),
        Index("ix_workouts_profile_timestamp", "profile_id", "occurred_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    activity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    intensity: Mapped[str] = mapped_column(String(16), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    profile: Mapped["Profile"] = relationship(back_populates="workouts")  # noqa: F821
