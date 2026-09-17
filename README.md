# Smart CMU Maintenance Request System

Interactive prototype for **954244 System Analysis and Design for Modern Management** (Chiang Mai University).
Reporters submit and track maintenance requests, technicians work assigned jobs, and admins manage requests and see analytics.

- **Core 1** Submit a request (category, urgency, location drill-down, description, 1–3 compressed photos, duplicate check)
- **Core 2** Track status (live vertical timeline, cancel, answer questions, confirm + rate or reopen)
- **Core 3** Technician job list and status updates (accept, waiting for parts, complete with after photos and notes)
- **Additional** Admin analytics dashboard (KPIs, charts, date ranges, Excel/PDF export) plus request management and master data

See [DEMO.md](DEMO.md) for test accounts and the demo script, and [REQUIREMENTS-TRACE.md](REQUIREMENTS-TRACE.md) for where each requirement lives in the code.

## Tech stack

Next.js 15 (App Router, Server Actions, TypeScript) · Tailwind CSS v4 · Framer Motion · Postgres (Supabase) via `postgres` · Supabase Storage + Realtime Broadcast · lucide-react · Recharts · browser-image-compression · zod · jose (httpOnly JWT cookie) · bcryptjs · exceljs · pdfkit

## Run locally (no Docker, no Supabase needed)

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local      # then set SESSION_SECRET to a long random string
npm run db:local                # terminal 1: local Postgres (PGlite) on 127.0.0.1:5433, data in ./.pglite
npm run db:migrate              # terminal 2
npm run db:seed
npm run dev                     # http://localhost:3000
```

Without Supabase settings, photos are saved to `public/uploads/` and screens refresh by polling `/api/pulse` every 4 seconds.
Keep `DATABASE_POOL_MAX=1` when using the local PGlite server.

`npm run db:reset` drops all tables, re-applies migrations, and re-seeds (use it to restore the demo state).

## Deploy (Supabase + Vercel)

1. **Create a Supabase project.**
2. **Database (no local tools needed)**: open *SQL Editor* in the Supabase dashboard, paste the whole of `db/supabase-setup.sql`, and press **Run**.
   It creates the tables in the `"SmartCMU"` schema, enables RLS, creates the public `request-images` bucket, and loads the demo data (timestamps are relative to when you run it).
   It also runs `alter role postgres set search_path to "SmartCMU", public, extensions` so the app, which connects as `postgres` through the pooler, finds the tables without schema-qualified queries (the pooler ignores `search_path` in the connection URL). Use `SETUP_SCHEMA=<name> npm run db:export-sql` for a different schema name.
   Re-running it resets the data. To regenerate the file after changing migrations or the seed: `npm run db:reset && npm run db:export-sql`.
3. **Keys**: from *Project Settings → API* copy the project URL, `anon` key, and `service_role` key.
4. **Vercel**: import the repository and set these environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler URL |
| `DATABASE_POOL_MAX` | leave empty (defaults to 5) |
| `SESSION_SECRET` | 32+ random characters (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (used only to subscribe to Realtime Broadcast) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (server only: storage uploads and broadcasts) |
| `SUPABASE_STORAGE_BUCKET` | `request-images` |

Vercel serves HTTPS by default. The session cookie is `Secure` in production.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | TypeScript check |
| `npm run db:local` | Local Postgres (PGlite over the wire protocol) |
| `npm run db:migrate` | Apply `db/migrations/*.sql` in order |
| `npm run db:seed` | Seed master data, demo accounts, ~40 requests over the last 60 days |
| `npm run db:reset` | Drop, migrate, and seed |
| `npm run db:export-sql` | Write `db/supabase-setup.sql` (schema + current data) for the Supabase SQL Editor |
| `npx tsx --conditions=react-server scripts/check-flow.ts` | Automated state-machine check (creates and deletes a throwaway request) |
| `npx tsx --conditions=react-server scripts/demo-step.ts <code> assign <tech>` \| `in_progress` \| `completed` | Drive a request from the terminal during a demo |

## Project structure

```
app/
  login/                    Simulated CMU login
  (onboarding)/profile/setup  First-time profile + PDPA consent
  (reporter)/               home, request/new, request/[code], history, notifications, profile
  (technician)/tech/        job list, job/[code], notifications, profile
  (admin)/admin/            dashboard, requests (table + side panel), settings (master data)
  actions/                  Server Actions per role (auth, requests, technician, admin, settings, profile, notifications)
  api/                      upload (XHR progress), pulse (polling fallback), admin/export/{xlsx,pdf}
components/
  ui/                       Button, GroupedList, Sheet, StatusPill, Skeleton, SegmentedControl, Field, ...
  shell/                    Tab bars, notification bell/list, live updates, idle logout
  request/ reporter/ tech/ admin/   Feature components
lib/
  db/                       Postgres client
  auth/                     Session (jose) and server-side guards
  requests/transition.ts    transitionStatus(): the single status state machine + history + notifications
  requests/queries.ts       Role-scoped data access
  dashboard.ts, export.ts   Analytics queries, Excel and PDF builders
  timeline.ts, status.ts    Timeline model and shared status vocabulary
db/migrations/              SQL migrations
scripts/                    local DB, migrate, seed, checks
```

## Design notes

- **Status machine**: every change goes through `transitionInTx()` in `lib/requests/transition.ts`, which checks the rule table (role, owner, assignee), writes `status_history`, and creates notifications for the reporter, followers, and technician. Invalid transitions throw and are shown as Thai error messages.
- **Auto-close**: completed requests close after 3 days. This is checked on read (throttled to once per 30 s) on the home, history, tracking, technician, and admin pages. Admins have a "จำลองเวลาผ่านไป 3 วัน" demo button on the dashboard.
- **Realtime**: after each change the server sends a payload-free broadcast to `user-<id>` and `admins` topics. Clients re-fetch through authorized server code (`router.refresh()`), so no data travels over the public channel.
- **Security**: all tables are reached only from the server. On Supabase, RLS is enabled with no policies, so the anon key cannot read tables.
- **Font**: LINE Seed Sans TH is used when installed on the device. It is not on Google Fonts; to ship it, add its `.woff2` files to `public/fonts/` and add `url()` sources to the `@font-face` rules in `app/globals.css`. IBM Plex Sans Thai is the loaded fallback.
