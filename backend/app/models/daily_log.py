import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DailyWellnessLog(Base):
    __tablename__ = "daily_wellness_logs"
    __table_args__ = (
        UniqueConstraint("profile_id", "log_date", name="uq_daily_log_profile_date"),
        Index("ix_daily_logs_profile_date", "profile_id", "log_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    steps: Mapped[int] = mapped_column(Integer, nullable=False)
    resting_heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sleep_duration_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_quality: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    profile: Mapped["Profile"] = relationship(back_populates="daily_logs")  # noqa: F821
