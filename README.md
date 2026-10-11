# Vigilens

**Monitor. Understand. Act.** Vigilens is a personal wellness tracker for daily movement, sleep, and workouts. Its summaries are deterministic descriptions of saved records and user-set goals; they are not medical advice.

## Project layout

- `frontend/` — React, Vite, TypeScript, React Router, Tailwind, Recharts, Lucide, and Supabase Auth.
- `backend/` — FastAPI API, SQLAlchemy models, Pydantic schemas, services, and Alembic migrations.
- `AGENTS.md` — the product and engineering specification.

## Requirements

- Node.js 20 or newer and npm.
- Python 3.11 or newer.
- A Supabase project with email/password authentication enabled and its PostgreSQL connection details.

## One-time Supabase setup

1. Create a Supabase project and enable **Email** under Authentication providers. Configure the allowed redirect URLs for your local and deployed frontend.
2. Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL` to the project's PostgreSQL connection string (use the Supabase session pooler if your network cannot use the direct IPv6 endpoint), and set `SUPABASE_URL` to the project URL. Use the database password only in the backend environment. `SUPABASE_JWT_SECRET` is needed only for legacy HS256 signing; asymmetric signing keys are verified through the project's JWKS endpoint.
3. Copy `frontend/.env.example` to `frontend/.env`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` to the project URL and public anon/publishable key, and `VITE_API_URL` to the reachable API base URL. Never put a database password or service-role/secret key in frontend variables.
4. Apply the schema from `backend/`:

   ```sh
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   alembic upgrade head
   ```

The migration adds a profile table linked to `auth.users`, plus user-owned daily wellness and workout tables. Row-level security is enabled with no browser-facing policies; FastAPI accesses the tables through its trusted backend database connection. The API creates a profile from the verified Supabase identity on the first authenticated profile/data request. Tables are not created during application startup.

## Run locally

Start the backend from `backend/` with the virtual environment activated:

```sh
uvicorn app.main:app --reload
```

In another terminal, start the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The API health endpoint is `http://localhost:8000/api/v1/health`; interactive API docs are at `http://localhost:8000/docs`.

## Verification

From `backend/`, run backend checks:

```sh
pytest
```

From `frontend/`, check TypeScript and create the production bundle:

```sh
npm run typecheck
npm run build
```

The migration requires a configured, reachable Supabase database. Authentication and persistence require the configured Supabase project. The development-only **Add demo week** dashboard action adds clearly labelled synthetic records to empty dates and never replaces existing entries; the endpoint is not registered when `APP_ENV=production`.

## Privacy notes

All wellness data reads and writes go through FastAPI. FastAPI verifies Supabase access-token signatures and scopes each query to the authenticated user's profile. The frontend only uses Supabase Auth and never queries wellness tables. Do not commit `.env` files, real user data, tokens, passwords, or service-role keys.
