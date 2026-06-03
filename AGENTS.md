# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

Single-package **Vite + React 19** PWA (`class-library`) backed by **hosted or local Supabase**. There is no in-repo backend, Docker Compose, or monorepo. See `README.md` for routes and `package.json` for scripts.

### Services

| Service | Required for full dev | Notes |
|--------|------------------------|-------|
| **Vite dev server** | Yes | `npm run dev` → http://localhost:5173 |
| **Supabase** | Yes for data flows | Cloud project (`.env.local`) **or** local stack via Supabase CLI + Docker |
| **Open Library** | Optional | Public HTTPS; needed for add-book search / external recs |

### Standard commands (from repo root)

- **Install:** `npm install` (runs `predev`/`prebuild` tesseract copy automatically when using those scripts)
- **Dev:** `npm run dev`
- **Lint:** `npm run lint`
- **Format check:** `npm run format:check` (many files may warn; pre-existing)
- **Build:** `npm run build`
- **Preview prod build:** `npm run preview`
- **Seed DB:** `npm run db:seed` (requires `.env.local` with valid Supabase URL + anon key)

### Environment

Copy `cp .env.example .env.local` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_TEACHER_PASSCODE` (4 digits). Without these, the app shows a “Database not connected” banner and data routes no-op.

### Local Supabase (Cloud Agent VMs)

This repo has SQL migrations under `supabase/migrations/` but **no** `supabase/config.toml`. To run locally:

1. Ensure **Docker** is installed and the daemon is reachable (`sudo service docker start`; socket may need `sudo chmod 666 /var/run/docker.sock` for the `ubuntu` user).
2. In a **temp directory** (e.g. `/tmp/class-library-supabase`): `npx supabase@2 init`, create `supabase/migrations/`, copy `*.sql` from this repo’s `supabase/migrations/`, then `npx supabase@2 start`.
3. `npx supabase@2 status -o env` → use `API_URL` as `VITE_SUPABASE_URL` and `ANON_KEY` as `VITE_SUPABASE_ANON_KEY` in `/workspace/.env.local`.
4. From `/workspace`: `npm run db:seed` once after migrations apply.

Local demo JWT anon key (default Supabase CLI) is documented in Supabase’s local dev docs; do not use in production.

### Gotchas

- **PWA service worker** is disabled in dev (`vite.config.js`); test install/offline on `npm run build` + `npm run preview` or a deployed URL.
- **Camera/QR** needs HTTPS in production; `localhost` works in dev.
- **Teacher passcode** is client-side only; it does not replace Supabase for data access.
- Supabase local stack is **not** started by the VM update script; start it manually when you need DB-backed flows.
