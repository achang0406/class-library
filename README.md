# Class Library

Mobile-first PWA for cataloging a classroom library — custom QR barcode labels (with title + author on each sticker), Open Library metadata autosuggest, browse filters, checkout kiosk for students/staff/guests, and teacher tools.

## Stack

- React 19 + Vite + React Router
- Supabase (PostgreSQL, `lyanne_library` schema)
- PWA (`vite-plugin-pwa`)
- Open Library API (covers + metadata)
- `qrcode` + `html5-qrcode`

## Supabase projects

| Environment | Project | Schema |
|-------------|---------|--------|
| **Production** | DiscCheck hub (`mczxxonwvsztbrqmjzlu`) | `lyanne_library` |
| **Preview / local dev** | Staging (`iunqmpxpwhybqyfxcsdt`) | `lyanne_library` |

Pickup-frisbee (`pickup_frisbee` schema) lives on the same prod and staging projects.

## Setup

### 1. Supabase schema

On the **shared hub** (prod or staging), run once in SQL Editor:

- [`supabase/migrations/004_lyanne_library_schema.sql`](supabase/migrations/004_lyanne_library_schema.sql)

Legacy migrations `001`–`003` targeted `public` on a standalone project; use `004` for new shared-hub installs.

Ensure `lyanne_library` is exposed in **API → Exposed schemas** (included when using disc-check's `supabase config push`).

### 2. Environment

```bash
cp .env.example .env.local
```

Point `.env.local` at **staging** for local development:

```env
VITE_SUPABASE_URL=https://iunqmpxpwhybqyfxcsdt.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
VITE_SUPABASE_DB_SCHEMA=lyanne_library
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

If you have checkouts from before student tracking shipped, run `npm run db:backfill-borrowers` once to link them to roster names.

## Scripts

| Command                | Description                   |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Dev server                    |
| `npm run build`        | Production build              |
| `npm run preview`      | Preview production build      |
| `npm run preview -- --host 0.0.0.0` | LAN preview for device testing |
| `npm run lint`         | ESLint                        |
| `npm run lint:fix`     | ESLint auto-fix               |
| `npm run format`       | Prettier write                |
| `npm run format:check` | Prettier check                |
| `npm run db:seed`              | Seed sample books & borrowers        |
| `npm run db:backfill-borrowers` | Link old checkouts to roster IDs    |
| `npm run db:backfill-lexile`    | Fetch Lexile from Open Library      |

## Book recommendations

Each student gets personalized suggestions on their **reading profile** (`/teacher/students/:id`, linked from the class roster). The system is **rule-based** — no ML or LLM training.

Full details: [`docs/RECOMMENDATIONS.md`](docs/RECOMMENDATIONS.md)

## Deploy (Vercel)

| Variable | Production | Preview |
|----------|------------|---------|
| `VITE_SUPABASE_URL` | Prod hub URL | Staging URL |
| `VITE_SUPABASE_ANON_KEY` | Prod hub anon | Staging anon |
| `VITE_SUPABASE_DB_SCHEMA` | `lyanne_library` | `lyanne_library` |
| `VITE_TEACHER_PASSCODE` | Your passcode | Your passcode |

Import in [Vercel](https://vercel.com) — framework preset **Vite**. `vercel.json` handles SPA routing.

## PWA on iPhone or iPad

Camera scanning and **Add to Home Screen** require **HTTPS**. The deployed Vercel URL is the easiest path for day-to-day classroom use.

### Production (recommended)

1. Open the deployed site in **Safari** (not Chrome).
2. Tap **Share** → **Add to Home Screen**.
3. Launch from the home screen icon for kiosk-style checkout.

### Local build on a physical device

Use this to test the real PWA (service worker, install prompt, camera) before deploying. Your Mac and iPhone/iPad must be on the **same Wi‑Fi network**, and `.env.local` must point at your Supabase project.

#### 1. Build and serve on your LAN

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

Preview defaults to port **4173**. Find your Mac's IP:

```bash
ipconfig getifaddr en0
```

On the device, open `http://YOUR_MAC_IP:4173` in Safari. You can click through the app, but **camera and PWA install will not work over plain HTTP** on iOS.

#### 2. Expose HTTPS with a tunnel (required for camera + install)

Keep `vite preview` running, then in another terminal:

```bash
# Option A: ngrok (install from https://ngrok.com)
ngrok http 4173

# Option B: Cloudflare Tunnel (install cloudflared)
cloudflared tunnel --url http://localhost:4173
```

Copy the **https://** URL from the tunnel output and open it in **Safari** on the iPhone/iPad.

#### 3. Install on the device

1. Open the **https://** URL in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Open the app from the new icon (standalone mode, no browser chrome).

#### Quick UI-only check (no PWA, no camera)

For layout and navigation only:

```bash
npm run dev -- --host
```

Open `http://YOUR_MAC_IP:5173` on the device. The dev server does not register the service worker, and iOS blocks the camera on non-HTTPS pages except `localhost`.

#### Troubleshooting

| Issue | Fix |
| ----- | --- |
| Page won't load on device | Confirm same Wi‑Fi; allow incoming connections if macOS Firewall prompts |
| Camera permission denied | Use an **https://** URL (tunnel or Vercel), not `http://` |
| Add to Home Screen missing | Use Safari; open the production or tunneled HTTPS URL after `npm run build` |
| Stale app after changes | Re-run `npm run build`, restart preview, remove old home-screen icon and re-add |

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
supabase/migrations/   SQL schema (004 = shared hub)
scripts/               Seed and backfill scripts
```

## Label workflow

1. **Add book** → barcode assigned automatically (`LIB-000001`, …).
2. **Print labels** → each sticker shows QR + **title + author** + barcode ID.
3. Match stickers to books by reading the title — no stack order needed.

## Teacher password

The teacher passcode is checked client-side (`VITE_TEACHER_PASSCODE`, four digits). It keeps casual visitors out of admin screens; the Supabase anon key is still required for data access. Teacher mode auto-signs-out after 30 minutes idle and shows a **Teacher** badge in the header on student-facing pages while active (tap to sign out).
