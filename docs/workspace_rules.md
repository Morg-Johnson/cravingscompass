
# WORKSPACE_RULES.md

## 0) Summary (read this first)
- P1 & P2: build and run everything locally:
  - `client/` (React PWA)
  - `api/` (Express API)
  - Supabase (cloud) for Postgres + Auth
- Push to GitHub frequently for backup and instructor visibility.
- Keep scope tight: ship a working “deals feed + filters + details” first, then add advanced features (route map, personalization, community, notifications).

## 1) Git & Branching (simple mode)
- Default workflow: `main` branch only.
- Optional: short-lived feature branches named `feat/<short-name>`.
- Commit early/often (aim: 5–10 commits/week).
- Remote: push at least once per work session (end-of-day rule).

### Commit message format
`[scope]: imperative summary`

Allowed scopes:
- `client`
- `api`
- `supabase`
- `docs`
- `infra`

Examples:
- `api: add GET /deals with sorting`
- `client: wire deals list to API`
- `supabase: add deals table migration`
- `docs: update task list acceptance criteria`

## 2) Repo Layout (authoritative)
- `/client/` React PWA (local dev: Vite)
- `/api/` Express API (local dev: Node)
- `/supabase/` SQL migrations + seeds
- `/docs/` planning docs, OpenAPI notes, deployment notes

## 3) Local Development Rules
- Run client and API locally as two separate processes.
- The client must call the API via a configurable base URL (environment variable), not a hard-coded URL.
- Keep local setup repeatable:
  - Add setup steps to root `README.md` when they change.

## 4) Environment Variables & Secrets
- Never commit secrets.
- Store secrets in `.env` files (ignored by git).
- Expected (initial) env vars:
  - Client:
    - `VITE_API_BASE_URL`
  - API:
    - `PORT`
    - `SUPABASE_URL`
    - `SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
    - `SUPABASE_JWT_SECRET` (if needed for verification)

## 5) API Rules (Express)
- Prefer REST endpoints with predictable naming.
- All responses are JSON.
- Use consistent error shape (example):
  - `{ "error": { "code": "...", "message": "..." } }`
- Validate input on every endpoint.
- Versioning (simple): no version prefix for MVP. If needed later, use `/v1`.

Suggested endpoints (MVP-first):
- `GET /health`
- `GET /deals` (supports search/sort/filter via query params)
- `GET /deals/:id`

## 6) Database Rules (Supabase/Postgres)
- All schema changes must be done via migrations in `supabase/`.
- Seed data should be repeatable and safe to run in dev.
- Prefer storing timestamps as UTC.
- Don’t store precise user location history by default.

## 7) Auth Rules (Supabase Auth)
- Use Supabase Auth for sign-up/login.
- The API must enforce authorization on protected endpoints.
- Client should treat auth tokens as sensitive and never log them.

## 8) Client Rules (React PWA)
- Mobile-first UI is the default.
- Always implement:
  - loading state
  - empty state
  - error state
- Keep network calls centralized (single API client module) to avoid duplication.

## 9) Testing & Quality Bar
- Add automated tests where they prevent regressions:
  - API: endpoint tests for core routes (`/deals`, `/deals/:id`)
  - Client: basic tests for key flows (search, sort, detail view)
- Fix lints/type errors before pushing.

## 10) Deployment (later milestone)
- Separate deploy targets:
  - client deployed independently from api
  - supabase remains hosted in Supabase Cloud
- Document the deployment steps in `docs/` before the first production deploy.

