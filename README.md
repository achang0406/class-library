# Class Library

Mobile-first PWA for cataloging a classroom library — custom QR barcode labels (with title + author on each sticker), Open Library metadata autosuggest, browse filters, checkout kiosk for students/staff/guests, and teacher tools.

## Stack

- React 19 + Vite + React Router
- Supabase (PostgreSQL)
- PWA (`vite-plugin-pwa`)
- Open Library API (covers + metadata)
- `qrcode` + `html5-qrcode`

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run migrations in order:
   - [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql)
   - [`supabase/migrations/002_add_lexile.sql`](supabase/migrations/002_add_lexile.sql) (if not already applied)
   - [`supabase/migrations/003_student_tracking.sql`](supabase/migrations/003_student_tracking.sql)
3. Copy **Project URL** and **anon public** key from Settings → API.

If you have checkouts from before student tracking shipped, run `npm run db:backfill-borrowers` once to link them to roster names.

### 2. Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_TEACHER_PASSCODE=1234
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 4. Seed sample data (optional)

```bash
npm run db:seed
```

## Scripts

| Command                | Description                   |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Dev server                    |
| `npm run build`        | Production build              |
| `npm run preview`      | Preview production build      |
| `npm run lint`         | ESLint                        |
| `npm run lint:fix`     | ESLint auto-fix               |
| `npm run format`       | Prettier write                |
| `npm run format:check` | Prettier check                |
| `npm run db:seed`              | Seed sample books & borrowers        |
| `npm run db:backfill-borrowers` | Link old checkouts to roster IDs    |

## Book recommendations

Each student gets personalized suggestions on their **reading profile** (`/teacher/students/:id`, linked from the class roster). The system is **rule-based** — no ML or LLM training.

1. **Build a profile** from checkout history: top genres, top authors, and books already borrowed.
2. **In-library recs** — score available books (+3 genre match, +2 author match, +popularity), exclude books they have already checked out. New readers with little history get popular picks instead.
3. **External recs** — search Open Library by the same genres/authors, drop titles you already own, show the rest with links.

Full details: [`docs/RECOMMENDATIONS.md`](docs/RECOMMENDATIONS.md)

## Deploy (Vercel + Supabase)

1. Push repo to GitHub.
2. Import project in [Vercel](https://vercel.com) — framework preset **Vite**.
3. Add environment variables (same as `.env.local`).
4. Deploy. `vercel.json` handles SPA routing.

Supabase stays on the free tier for a single classroom; no extra backend required.

## Install on iPad (PWA)

1. Open the deployed site in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Use **Check Out / Return** from the home screen icon for kiosk mode.

Camera scanning requires **HTTPS** (Vercel provides this).

## Routes

| Route                         | Description                     |
| ----------------------------- | ------------------------------- |
| `/`                           | Landing                         |
| `/browse`                     | Browse & filter library         |
| `/books/:id`                  | Book detail                     |
| `/kiosk`                      | Student/staff checkout & return |
| `/teacher`                    | Teacher login                   |
| `/teacher/dashboard`          | Stats & links                   |
| `/teacher/add`                | Add book (Open Library search)  |
| `/teacher/add?mode=rapid`     | Rapid Add + batch labels        |
| `/teacher/labels`             | Select books → print            |
| `/teacher/labels/print?ids=…` | Print label sheet               |
| `/teacher/people`             | Class roster + staff            |
| `/teacher/reading`            | Class-wide student reading stats |
| `/teacher/students/:id`       | Student reading profile & recs  |
| `/teacher/overdue`            | Overdue loans                   |
| `/teacher/import`             | CSV bulk import                 |

## Project structure

```
src/
  components/ui/       Design system
  components/books/    Book grid, Open Library search
  components/scanner/  QR camera scanner
  components/labels/   Printable Avery-style labels
  pages/               Route pages
  lib/                 Supabase, Open Library, checkouts
supabase/migrations/   SQL schema
scripts/seed.mjs       Sample data
```

## Label workflow

1. **Add book** → barcode assigned automatically (`LIB-000001`, …).
2. **Print labels** → each sticker shows QR + **title + author** + barcode ID.
3. Match stickers to books by reading the title — no stack order needed.

## Teacher password

The teacher passcode is checked client-side (`VITE_TEACHER_PASSCODE`, four digits). It keeps casual visitors out of admin screens; the Supabase anon key is still required for data access. Teacher mode auto-signs-out after 30 minutes idle and shows a **Teacher** badge in the header on student-facing pages while active (tap to sign out).
