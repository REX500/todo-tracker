# Todo Tracker

A small, personal todo tracker with two views over the same data:

- **List** — add/edit/delete, status & tag filters, search, four stat counters, deadline highlights (`overdue` / `soon` / `ok`).
- **Board** — group-by-tag infinite canvas with mouse-drag pan, trackpad pan/pinch-zoom, sticky fading column headers, jump-to-latest, and a per-column add button that pre-fills the tag.

Originally a pair of self-contained HTML files using `localStorage`; now a typed Next.js app with a Postgres backend, admin auth, and a one-time importer for legacy local data.

## Stack

- **Next.js 14** App Router, React 18, TypeScript (strict)
- **Vercel Postgres** (`@vercel/postgres`) — raw SQL via tagged templates, no ORM (mirrors the `gift-list` sibling repo's pattern)
- **Zod** for request validation; schemas are the source of `TodoInput` / `Status` types
- **`jose`** HS256 JWT cookie for admin auth
- **shadcn/ui** with Tailwind (zinc base, lucide icons): `button`, `input`, `label`, `textarea`, `dialog`, `badge`, `card`, `separator`
- **Jest** + `ts-jest` for unit + integration tests

## Local setup

```bash
# 1. Clone, install
make install

# 2. Configure auth + DB env
cp .env.example .env.local
# Edit .env.local — set ADMIN_USERNAME, ADMIN_PASSWORD, AUTH_SECRET
#   AUTH_SECRET: openssl rand -base64 32

# 3. Pull Postgres connection vars from Vercel (after linking the project once)
npx vercel link
npx vercel env pull .env.local

# 4. One-shot DB init
make db-init

# 5. Run the dev server
make dev
```

Visit http://localhost:3000 — you'll be bounced to `/login`, then to `/list`.

## Environment variables

| Variable          | Required | Notes                                                |
| ----------------- | -------- | ---------------------------------------------------- |
| `ADMIN_USERNAME`  | yes      | Login username                                       |
| `ADMIN_PASSWORD`  | yes      | Login password                                       |
| `AUTH_SECRET`     | yes      | At least 16 chars; sign JWT cookie                   |
| `POSTGRES_URL`    | yes      | Auto-provisioned by Vercel Postgres integration      |
| Other `POSTGRES_*` | no      | Auto-populated alongside `POSTGRES_URL`              |

## Make targets

| Target           | Does                                              |
| ---------------- | ------------------------------------------------- |
| `make install`   | `npm install`                                     |
| `make dev`       | Next dev server                                   |
| `make build`     | Production build                                  |
| `make start`     | Run the production build                          |
| `make lint`      | `next lint`                                       |
| `make typecheck` | `tsc --noEmit`                                    |
| `make test`      | Jest (unit + integration)                         |
| `make test-unit` | Just the unit suite                               |
| `make test-int`  | Just the integration suite (needs `POSTGRES_URL`) |
| `make db-init`   | Create the `todos` table if it doesn't exist      |
| `make clean`     | Remove `.next` and `node_modules`                 |

## Testing

- **Unit tests** (`tests/unit/`) cover the Zod schema, tag-colour hashing, deadline thresholds, and JWT sign/verify — no database needed.
- **Integration tests** (`tests/integration/`) hit the App Router route handlers directly with native `Request` objects and assert on the returned `Response`. They require `POSTGRES_URL` to be set; without it they skip themselves and print a warning. Point them at a throwaway Vercel Postgres database — every DB test truncates the `todos` table in `beforeEach`.

## Importing legacy localStorage data

The original HTML files stored todos under `localStorage["filip_todos"]`. The first time the new app loads in a browser that already has that key, an import banner appears at the top of every page offering to push those todos into the database. Once you click Import or Dismiss, the banner sets `localStorage["filip_todos_imported"]` and never shows again. The original key is left alone, so you can re-import manually by clearing the imported flag.

## Deploy to Vercel

1. Push the repo to GitHub.
2. On vercel.com, Add New → Project, import the repo.
3. In Storage → Create Database, add Postgres (powered by Neon) and connect it to this project. Vercel injects `POSTGRES_URL` and friends automatically.
4. In Settings → Environment Variables, add `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `AUTH_SECRET`.
5. Deploy.
6. After the first deploy, initialise the table:
   ```bash
   npx vercel link
   npx vercel env pull .env.local
   make db-init
   ```

## Project structure

```
app/
  api/
    auth/          login + logout
    todos/         CRUD + status patch + bulk import
  list/            list view page (RSC → ListView)
  board/           board view page (RSC → BoardView)
  login/           login page
  layout.tsx       shell + TopNav
  page.tsx         redirect → /list
components/
  ui/              shadcn primitives only
  list-view.tsx    'use client' — list, filters, edit dialog
  board-view.tsx   'use client' — pan/zoom canvas, sticky chips
  todo-form-fields.tsx
  tag-badge.tsx, deadline-chip.tsx, import-banner.tsx, top-nav.tsx
lib/
  db.ts            ensureSchema + CRUD + import + truncate (raw SQL)
  schema.ts        Zod schemas; source of TodoInput/Status types
  types.ts         Todo entity
  auth.ts          jose JWT cookie session
  tag-colors.ts, deadline.ts, api.ts, utils.ts
middleware.ts      redirects unauth requests to /login
scripts/init-db.mjs
tests/{unit,integration}/
```

## Notes

- `@vercel/postgres` is marked deprecated by Vercel as of 2025 in favour of `@neondatabase/serverless` — this repo intentionally mirrors the sibling `gift-list` repo's stack until that one migrates.
- Next.js 14.2.15 carries a published security advisory; bump when convenient.
