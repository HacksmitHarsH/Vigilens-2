# Vigilens project specification

## Purpose

Build Vigilens, a responsive wellness-tracking prototype for general wellness users to record activity, sleep, and workouts; review historical trends; and understand their recorded data. Tagline: **Monitor. Understand. Act.** This is a functional prototype, not a frontend-only mockup.

## Workspace and workflow

- Work only in `/Users/HarshAshthana/Desktop/Vigilens`; this is a new project built from scratch.
- Do not use, inspect, modify, or copy from `/Users/HarshAshthana/Vigilens`.
- Keep this specification current in the root `AGENTS.md`.
- Build in phases: database, backend, frontend, then end-to-end integration.
- Inspect the current repository before adding files or dependencies and preserve user changes.
- Do not fabricate credentials, silently substitute mock services, or claim unfinished functionality is complete.
- When credentials are unavailable, implement the real integration and document the required manual setup.

## Stack

- Frontend: React, Vite, TypeScript, React Router, Tailwind CSS, Recharts, Lucide.
- Authentication: Supabase Auth with email/password, persistent sessions, protected pages, authenticated API calls, and correct expired-session handling.
- Backend: Python, FastAPI, Pydantic, SQLAlchemy 2.x, Alembic, psycopg.
- Database: Supabase-hosted PostgreSQL.
- Tests: pytest for backend and suitable frontend checks.
- Use compatible stable versions. Avoid unnecessary libraries, services, containers, and infrastructure.

## Product features

### Authentication and profile

- Register, log in, and log out; persist sessions and protect application pages.
- Verify Supabase access tokens cryptographically on protected APIs. Derive identity from the verified token, never a client `user_id`.
- Profile: display name, optional height/weight, user-defined daily step goal and sleep goal; persist edits.

### Daily wellness

- Create, view, edit, and delete entries with date, steps, optional resting heart rate, optional sleep duration, optional sleep quality (1–5), and optional note.
- Enforce at most one entry per user per date. Validate on client and server and return readable errors.
- Preserve missing values as missing; do not turn them into zero.

### Dashboard and summaries

- Show today's or latest recorded metrics, days logged in selected period, seven-day step and sleep charts, and averages from actual saved records.
- Support empty states and refresh the dashboard after record changes.
- Rule-based, deterministic descriptive summaries from the user's records and goals. No AI/ML, diagnosis, clinical risk score, or predictive health advice.

### Workouts

- Create, view, edit, and delete workouts with activity type, duration, intensity, timestamp, and optional notes; show history.

### Development demo data

- Provide a development-only action for the signed-in user to seed clearly labelled synthetic records for the previous seven days.
- Never use real patient data or expose seeding in production. Protect existing records from overwrite.

## Backend requirements

- Modular FastAPI app with routers, schemas, services, database models, and configuration under `/api/v1`.
- Health check; profile, daily wellness CRUD, workout CRUD, dashboard summary/trends, deterministic insight, and development demo seed endpoints.
- Centralized understandable error responses, CORS restricted to configured frontend origins, database migrations with Alembic, and auth/ownership dependencies.
- Restrict every read/update/delete to the verified user's records. Return appropriate unauthenticated and missing-record errors.
- Keep all wellness data access in FastAPI. Frontend uses Supabase Auth only and must not query wellness tables directly.
- Do not create tables automatically at application startup.

## Database

- Relational `profiles`, `daily_wellness_logs`, and `workouts` tables, UUID identifiers, timestamps, foreign keys, unique constraints, and useful indexes.
- Profile UUID corresponds to Supabase Auth user UUID. Logs and workouts belong to a profile. Use migrations rather than startup table creation.

## Frontend

- Polished responsive dark charcoal/navy interface with cyan/teal accents, restrained purple highlights, readable text, and accessible contrast, inspired by the Vigilens presentation without unsupported clinical claims.
- App shell/navigation, login and registration, profile, dashboard with real charts, wellness logging/history, workout logging/history.
- Reusable components, centralized API client, validation, loading/empty/success/error states, destructive-action confirmation.
- All normal app data comes from the backend. Mock data only in tests or explicitly labelled development demo data.

## Security and privacy

- Never commit secrets or real environment files. Provide `.env.example` files with placeholders.
- Never expose the database password or Supabase service-role/secret key to frontend code.
- Never decode tokens without cryptographic verification. Enforce backend ownership, validate server inputs, and do not log tokens, passwords, or sensitive notes.
- Do not claim regulatory compliance or clinical accuracy without evidence.

## Completion workflow

- End-to-end target: register/login; create/update profile; save wellness entry via validated FastAPI/PostgreSQL; show persisted data on dashboard after refresh and new login; edit/delete own records; ensure another user cannot read them; use workout history/charts/rule-based summaries; and document setup for new developers.
- Run relevant migrations, tests, linting, type checks, and production build when configuration is available. Fix project-scope errors.
- Do not implement AI/ML functionality in this version.
