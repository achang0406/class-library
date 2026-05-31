# Class Library

Mobile-first PWA for cataloging a classroom library — custom barcode labels, Open Library metadata, browse filters, and a checkout kiosk for students, staff, and guests.

## Stack

- React 19 + Vite + React Router
- Supabase (PostgreSQL)
- PWA (`vite-plugin-pwa`)
- Design system with CSS custom property tokens

## Setup

```bash
cp .env.example .env.local
# Edit .env.local with Supabase URL, anon key, and teacher password

npm install
npm run dev
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

## Project structure

```
src/
  components/ui/     # Atomic design system components
  components/layout/ # App shell, header, page container
  pages/             # Route pages
  styles/            # tokens, colors, theme
  lib/               # Supabase client, teacher session
```

## Routes

- `/` — Landing
- `/browse` — Browse library
- `/books/:id` — Book detail
- `/kiosk` — Checkout / return kiosk
- `/teacher` — Teacher login
- `/teacher/dashboard` — Teacher dashboard (protected)
- `/teacher/add`, `/labels`, `/people`, `/overdue`, `/import`
