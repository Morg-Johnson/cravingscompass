# Cravings Compass

Mobile-first web app to help users quickly find the best fast food deals in their area without opening multiple apps.

## System functionality

Cravings Compass supports:

- Browsing and searching fast-food deals, with sorting and basic deal quality indicators
- Deal details view (restaurant, deal info, calories when available)
- Saving deals and favoriting restaurants (per-user)
- Notifications and rewards tracking UI
- Route Deals page with an interactive map (Leaflet/OpenStreetMap) and deal markers

## Live deployment

- Frontend (AWS Amplify): https://main.d3lfgydw18byww.amplifyapp.com/
- API (AWS API Gateway + Lambda via Serverless Framework): https://iwx1vfy6aj.execute-api.us-east-1.amazonaws.com/v1

The frontend is intended to be publicly viewable (no login required to view core browsing pages). Creating an account enables saving/favorites and account-specific features.

## Local development setup

### Prerequisites

- Node.js + npm
- A Supabase project (for auth + database)

### 1) API (Express)

From `api/`:

```bash
npm install
npm run dev
```

Create `api/.env` (not committed) with:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The API runs on `http://localhost:8000/v1`.

### 2) Frontend (Vite + React)

From `client/`:

```bash
npm install
npm run dev
```

Create `client/.env` (not committed) with:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

Then open the Vite URL (typically `http://localhost:5173`).

## Demo / what to test

- Browse deals on Home/Search
- Open a deal and use Save / Compare
- Favorites: favorite a restaurant and filter search results to favorites
- Saved deals: verify expiration date display and filtering
- Rewards: adjust point balances and set points expiration date
- Route Deals: verify map renders and shows restaurant/deal markers

If you need demo data, the API includes a dev seed endpoint (see `api/openapi.yaml`).

## Known issues / incomplete areas

- Deployment configuration requires setting build-time env vars in Amplify (Vite env vars are baked at build time).
- If the deployed frontend appears blank, ensure the Vite build `base` is configured for root hosting (Amplify).
- Map marker geocoding depends on third-party Nominatim availability and can be rate-limited on first load.

## Repo layout

- `client/` React PWA (local dev: Vite)
- `api/` Express API (local dev: Node)
- `supabase/` SQL migrations + seeds
- `docs/` PRD, site map, OpenAPI, deployment notes
