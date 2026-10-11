# Vigilens documentation

The complete product and engineering specification is maintained in the root [AGENTS.md](../AGENTS.md).

The root [README.md](../README.md) covers Supabase setup, local development, migrations, and verification commands.

## API outline

All application endpoints use `/api/v1` and require a Supabase access token, except `/health`.

- `GET /health`
- `GET, PUT /profile`
- `GET, POST /wellness`; `GET, PATCH, DELETE /wellness/{log_id}`
- `GET, POST /workouts`; `GET, PATCH, DELETE /workouts/{workout_id}`
- `GET /dashboard/summary?days=7`; `GET /dashboard/insights`
- `POST /demo/seed` in non-production environments only

FastAPI derives the profile UUID from the verified token and scopes every user data query to that profile. The frontend does not call Supabase wellness tables.
