"""Create Vigilens profile and wellness tables."""

import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("height_cm", sa.Float(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("step_goal", sa.Integer(), server_default="8000", nullable=False),
        sa.Column("sleep_goal_hours", sa.Float(), server_default="8", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "daily_wellness_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("profile_id", sa.Uuid(), nullable=False),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("steps", sa.Integer(), nullable=False),
        sa.Column("resting_heart_rate", sa.Integer(), nullable=True),
        sa.Column("sleep_duration_hours", sa.Float(), nullable=True),
        sa.Column("sleep_quality", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("profile_id", "log_date", name="uq_daily_log_profile_date"),
    )
    op.create_index("ix_daily_logs_profile_date", "daily_wellness_logs", ["profile_id", "log_date"])
    op.create_table(
        "workouts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("profile_id", sa.Uuid(), nullable=False),
        sa.Column("activity_type", sa.String(length=80), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("intensity", sa.String(length=16), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "intensity IN ('low', 'moderate', 'high')", name="ck_workouts_intensity"
        ),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_workouts_profile_timestamp", "workouts", ["profile_id", "occurred_at"])

    # Wellness tables are only accessed by FastAPI with its trusted database connection.
    # No browser-facing Supabase/PostgREST role receives a row policy.
    for table in ("profiles", "daily_wellness_logs", "workouts"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table in ("workouts", "daily_wellness_logs", "profiles"):
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
    op.drop_index("ix_workouts_profile_timestamp", table_name="workouts")
    op.drop_table("workouts")
    op.drop_index("ix_daily_logs_profile_date", table_name="daily_wellness_logs")
    op.drop_table("daily_wellness_logs")
    op.drop_table("profiles")
