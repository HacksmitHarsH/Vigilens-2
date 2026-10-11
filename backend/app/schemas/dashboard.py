from datetime import date

from pydantic import BaseModel

from app.schemas.daily_log import DailyLogRead


class TrendPoint(BaseModel):
    date: date
    steps: int | None
    sleep_duration_hours: float | None


class DashboardSummary(BaseModel):
    period_days: int
    days_logged: int
    average_steps: float | None
    average_sleep_hours: float | None
    latest_log: DailyLogRead | None
    step_goal: int
    sleep_goal_hours: float
    trend: list[TrendPoint]


class InsightSummary(BaseModel):
    generated_at: date
    summaries: list[str]
