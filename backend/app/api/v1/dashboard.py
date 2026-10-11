from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_profile
from app.db.session import get_db
from app.models.daily_log import DailyWellnessLog
from app.models.profile import Profile
from app.schemas.daily_log import DailyLogRead
from app.schemas.dashboard import DashboardSummary, InsightSummary, TrendPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    days: int = Query(default=7, ge=7, le=90),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    records = list(
        db.scalars(
            select(DailyWellnessLog)
            .where(
                DailyWellnessLog.profile_id == profile.id,
                DailyWellnessLog.log_date >= start_date,
                DailyWellnessLog.log_date <= end_date,
            )
            .order_by(DailyWellnessLog.log_date.asc())
        ).all()
    )
    latest = db.scalar(
        select(DailyWellnessLog)
        .where(DailyWellnessLog.profile_id == profile.id)
        .order_by(DailyWellnessLog.log_date.desc())
        .limit(1)
    )
    average_steps = sum(log.steps for log in records) / len(records) if records else None
    sleep_values = [
        log.sleep_duration_hours for log in records if log.sleep_duration_hours is not None
    ]
    average_sleep = sum(sleep_values) / len(sleep_values) if sleep_values else None
    by_date = {log.log_date: log for log in records}
    trend = [
        TrendPoint(
            date=day,
            steps=by_date[day].steps if day in by_date else None,
            sleep_duration_hours=by_date[day].sleep_duration_hours if day in by_date else None,
        )
        for offset in range(days)
        if (day := start_date + timedelta(days=offset))
    ]
    return DashboardSummary(
        period_days=days,
        days_logged=len(records),
        average_steps=average_steps,
        average_sleep_hours=average_sleep,
        latest_log=DailyLogRead.model_validate(latest) if latest else None,
        step_goal=profile.step_goal,
        sleep_goal_hours=profile.sleep_goal_hours,
        trend=trend,
    )


@router.get("/insights", response_model=InsightSummary)
def wellness_insights(
    profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)
) -> InsightSummary:
    end_date = date.today()
    start_date = end_date - timedelta(days=6)
    records = list(
        db.scalars(
            select(DailyWellnessLog).where(
                DailyWellnessLog.profile_id == profile.id,
                DailyWellnessLog.log_date >= start_date,
                DailyWellnessLog.log_date <= end_date,
            )
        ).all()
    )
    summaries: list[str] = []
    if not records:
        summaries.append("No wellness entries have been recorded in the last seven days yet.")
        return InsightSummary(generated_at=end_date, summaries=summaries)
    summaries.append(f"You recorded wellness data on {len(records)} of the last 7 days.")
    average_steps = sum(log.steps for log in records) / len(records)
    summaries.append(f"Your average was {average_steps:,.0f} steps per recorded day this week.")
    goal_days = sum(log.steps >= profile.step_goal for log in records)
    summaries.append(
        f"You reached your {profile.step_goal:,}-step goal on {goal_days} "
        f"of {len(records)} recorded days."
    )
    sleep_values = [
        log.sleep_duration_hours for log in records if log.sleep_duration_hours is not None
    ]
    if sleep_values:
        average_sleep = sum(sleep_values) / len(sleep_values)
        summaries.append(
            f"Average recorded sleep was {average_sleep:.1f} hours against your "
            f"{profile.sleep_goal_hours:g}-hour goal."
        )
    else:
        summaries.append("Sleep duration has not been recorded this week.")
    return InsightSummary(generated_at=end_date, summaries=summaries)
