from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import daily_logs, dashboard, health, profile, workouts
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router, prefix="/api/v1")
for router in (profile.router, daily_logs.router, workouts.router, dashboard.router):
    app.include_router(router, prefix="/api/v1")
if settings.app_env.lower() == "development":
    from app.api.v1 import demo

    app.include_router(demo.router, prefix="/api/v1")
