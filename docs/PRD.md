# Cravings Compass

## Description
Cravings Compass is a mobile-first web app that helps users quickly find fast food deals near them without needing to open multiple restaurant apps. The goal is to save time and money, especially for college students and people on the go.

## Tech stack
- Client: React (Vite) PWA
  - Why it matters: This is the mobile-first user interface people interact with. React helps build a fast, app-like experience.
  - PWA benefits: “Installable” on a phone home screen, improved perceived speed, and the ability to cache static assets.
  - Vite benefits: Faster local development and builds.
- API: Node.js (Express)
  - Why it matters: This is the “middle layer” that defines the rules of the app—what data can be requested, how it’s filtered, and what the responses look like.
  - Why not connect directly to the database from the client: The API lets you protect secrets, centralize business logic, and change database structure later without breaking the app.
- Database/Auth: Supabase (Postgres + Auth)
  - Why it matters: Postgres stores core app data (deals, restaurants, locations, saved deals). Supabase Auth manages user sign-in securely.
  - Security: Supabase supports Row Level Security (RLS) so you can strictly control what each user can read/write.
- Hosting (suggested)
  - Client: Netlify or Vercel
  - API: Render or Fly.io
  - Database: Supabase Cloud

### How these pieces work together (high level)
- The user opens the React PWA on their phone.
- The client calls the Express API over HTTPS to:
  - fetch nearby deals
  - run search/filter/sort
  - save a deal to the user’s account
- The Express API reads/writes data in Supabase (Postgres) and verifies identity using Supabase Auth.
