
# Cravings Compass — Task List

Format:
- Epic: <what you’re building>
  - Task: <specific unit of work> (frontend / API / DB / jobs)
    - user story: <the story it supports>
    - acceptance criteria: <how we know it’s done>

## Epic: Platform foundations (enables most features)

- Task: Set up Supabase schema + migrations (DB)
  - user story: supports all stories that read/write deals or user data
  - acceptance criteria:
    - Supabase project is configured for local dev via `.env`
    - Migrations exist under `supabase/` and can be applied cleanly
    - Core tables exist for deals + restaurants (exact naming may vary)

- Task: Implement API authentication middleware (API)
  - user story: supports stories that require user identity (save deals, personalization, community, notifications)
  - acceptance criteria:
    - Protected endpoints reject missing/invalid auth with consistent `401` response
    - Valid Supabase-authenticated requests include a user identifier available to handlers

- Task: Establish shared API error response format (API)
  - user story: supports all stories
  - acceptance criteria:
    - Errors return JSON with consistent shape (e.g., `{ error: { code, message } }`)
    - Client can display a user-friendly message for failures

## Epic: Deal aggregation (one place for deals)

- Task: Create core deal + restaurant data model (DB)
  - user story: as a user, I want to see all deals from different restaurants in one place so that I don’t have to open multiple apps
  - acceptance criteria:
    - DB can store restaurants, locations, and deals with an expiration timestamp
    - A deal record includes at minimum: title/description, price, restaurant reference, expires_at

- Task: Create unified deals feed endpoint (API)
  - user story: as a user, I want to see all deals from different restaurants in one place so that I don’t have to open multiple apps
  - acceptance criteria:
    - `GET /deals` returns a JSON array (or paginated object) of normalized deal objects
    - Response includes the fields required to render the home feed (id, title, price, restaurant, expires_at)

- Task: Build deals home feed (frontend)
  - user story: as a user, I want to see all deals from different restaurants in one place so that I don’t have to open multiple apps
  - acceptance criteria:
    - Home view loads deals from `GET /deals`
    - Loading + empty + error states are implemented

- Task: Implement an admin ingestion path for initial deals (DB/API)
  - user story: as a user, I want to see all deals from different restaurants in one place so that I don’t have to open multiple apps
  - acceptance criteria:
    - There is a documented way to add deals (admin UI or seed scripts)
    - Newly added deals appear in `GET /deals` without code changes

## Epic: Sorting and filtering (cheapest-first)

- Task: Support sorting by lowest price (API)
  - user story: as a college student, I want to filter deals by the lowest price so that I can find the cheapest meal quickly
  - acceptance criteria:
    - `GET /deals?sort=price_asc` returns deals sorted from lowest to highest price
    - Invalid sort value returns a safe default or a clear `400` error

- Task: Add “lowest price” sort control (frontend)
  - user story: as a college student, I want to filter deals by the lowest price so that I can find the cheapest meal quickly
  - acceptance criteria:
    - User can select “Lowest price” and the UI updates using `GET /deals?sort=price_asc`
    - The sort selection persists while browsing (within the session)

- Task: Add DB performance support for sorting (DB)
  - user story: as a college student, I want to filter deals by the lowest price so that I can find the cheapest meal quickly
  - acceptance criteria:
    - Appropriate index(es) exist to support price sorting at expected scale

## Epic: Search

- Task: Implement search query support (API)
  - user story: as a user, I want to search for specific food or restaurants so that I can find deals faster
  - acceptance criteria:
    - `GET /deals?query=<text>` returns matching deals
    - Searching by restaurant name returns deals from that restaurant

- Task: Build search bar UI and wire to API (frontend)
  - user story: as a user, I want to search for specific food or restaurants so that I can find deals faster
  - acceptance criteria:
    - Search input triggers requests to `GET /deals?query=...`
    - Results update with loading + empty + error states

## Epic: Deal details

- Task: Implement deal detail endpoint (API)
  - user story: as a user, I want to see deal details (price, calories, distance, expiration time) so that I can make informed decisions
  - acceptance criteria:
    - `GET /deals/:id` returns price and expiration time
    - Response includes restaurant info required for the detail screen
    - If calories/portion are not available, response still succeeds and fields are null/omitted consistently

- Task: Build deal detail screen (frontend)
  - user story: as a user, I want to see deal details (price, calories, distance, expiration time) so that I can make informed decisions
  - acceptance criteria:
    - Tapping a deal in the feed opens a detail view
    - Price + expiration display correctly
    - Handles missing calories gracefully

## Epic: Deal comparison

- Task: Build compare selection + comparison view (frontend)
  - user story: as a user, I want to compare deals based on price, calories, and portion size so that I can get the best value
  - acceptance criteria:
    - User can select multiple deals and open a compare view
    - Compare view displays price and any available calories/portion fields

- Task: Add nutrition/portion fields to deal model (DB/API)
  - user story: as a user, I want to compare deals based on price, calories, and portion size so that I can get the best value
  - acceptance criteria:
    - DB supports optional `calories` and portion fields
    - `GET /deals` and `GET /deals/:id` can return those fields when present

## Epic: Route-based map

- Task: Choose routing provider and document configuration (API)
  - user story: as a commuter, I want to see deals along my driving route so that I don’t waste time going out of my way
  - acceptance criteria:
    - Selected provider is documented (API key strategy, quotas, estimated costs)
    - Local dev configuration is defined via environment variables

- Task: Implement route deals endpoint (API)
  - user story: as a commuter, I want to see deals along my driving route so that I don’t waste time going out of my way
  - acceptance criteria:
    - `POST /routes/deals` accepts origin and destination
    - Response returns deals “along route” using a clearly defined distance threshold

- Task: Build route UI and map display (frontend)
  - user story: as a commuter, I want to see deals along my driving route so that I don’t waste time going out of my way
  - acceptance criteria:
    - User can enter a route and see matching deals
    - UI shows when route results are loading or if route lookup fails

## Epic: Personalization

- Task: Track user interactions (DB/API)
  - user story: as a user, I want personalized deal recommendations so that I can quickly find relevant offers
  - acceptance criteria:
    - System records basic events (deal views, saves, searches) associated with a user id when logged in

- Task: Implement recommended deals endpoint (API)
  - user story: as a user, I want personalized deal recommendations so that I can quickly find relevant offers
  - acceptance criteria:
    - `GET /deals/recommended` returns a ranked list for logged-in users
    - Anonymous users get a safe default (e.g., trending or newest)

- Task: Display recommended deals in UI (frontend)
  - user story: as a user, I want personalized deal recommendations so that I can quickly find relevant offers
  - acceptance criteria:
    - UI shows a “Recommended” section for logged-in users
    - Recommended deals come from `GET /deals/recommended`

## Epic: Community

- Task: Implement community data model (DB)
  - user story: as a user, I want to view community reviews and posted deals so that I can discover better options
  - acceptance criteria:
    - DB supports user posts and deal reviews tied to a user id
    - Basic moderation fields exist (e.g., reported flag)

- Task: Implement community endpoints (API)
  - user story: as a user, I want to view community reviews and posted deals so that I can discover better options
  - acceptance criteria:
    - `GET /community/posts` returns recent posts
    - `POST /community/posts` requires auth and creates a post
    - `GET /deals/:id/reviews` returns reviews for a deal
    - `POST /deals/:id/reviews` requires auth and creates a review

- Task: Build community UI (frontend)
  - user story: as a user, I want to view community reviews and posted deals so that I can discover better options
  - acceptance criteria:
    - Community page shows posts from `GET /community/posts`
    - Deal detail page shows reviews from `GET /deals/:id/reviews`

## Epic: Notifications

- Task: Implement notification preferences storage (DB/API)
  - user story: as a user, I want notifications for expiring or new deals so that I don’t miss opportunities
  - acceptance criteria:
    - User can enable/disable notification types
    - Preferences are persisted per-user

- Task: Implement notification sending job (jobs)
  - user story: as a user, I want notifications for expiring or new deals so that I don’t miss opportunities
  - acceptance criteria:
    - Scheduled process can identify expiring deals and target opted-in users
    - Notifications are sent via the chosen channel (email or push)

- Task: Build notification settings UI (frontend)
  - user story: as a user, I want notifications for expiring or new deals so that I don’t miss opportunities
  - acceptance criteria:
    - Settings screen updates preferences via an API endpoint
    - UI reflects current preference state
