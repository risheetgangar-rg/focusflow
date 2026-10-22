# Unstuck

A calm companion for brains that start late. Unstuck helps you get unstuck:
**dump everything out, see what's next, make it easy to begin, focus, feel the win, keep going.**
If life gets ahead of you, Rescue mode helps you reset without any guilt.

Built for ADHD brains, friendly to everyone.

## What's inside

| Area | What it does |
| --- | --- |
| **Today** | One clear answer to "what should I do right now?", with a "I have 15 minutes" re-rank, your plate for the day, habits, and progress. |
| **Tasks** | Search, filter and browse everything, grouped by when it's due. Quick capture understands "call mum tomorrow 5pm". Break big tasks into steps. |
| **Brain dump + Voice** | Type or speak a messy list; it's split into tasks you review before saving. |
| **Start mode (Focus)** | A chromeless, distraction-free timer for one task. Hard to start? Get a tiny first step. |
| **Habits** | Weekly targets with one-tap check-ins. Partial effort counts. |
| **Rescue** | Behind? Pick a small recovery set, move the rest, no shame. |
| **Daily review** | Evening wrap-up with a gentle reflection and a reschedule flow. |
| **Rewards** (optional) | XP, levels, momentum, quests, achievements, Boss Tasks, a companion, unlockable themes. Switch the game layer to *light* or *off* any time. |
| **Reminders** | Web Push notifications, plus an installable PWA. |
| **Guest mode** | Try it with no email or password. |

Tone rules throughout: supportive, direct, light. Never shaming. ("Was due yesterday", never "Overdue!!!")

## Stack

- **Next.js 16** (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4
- **shadcn/ui** components on **Base UI**, **motion** for animation
- **Supabase** (Postgres, Auth, Row Level Security everywhere) via `@supabase/ssr`
- **Zod** for validation, **Vitest** for unit tests, **Playwright** for end-to-end tests
- **Web Push** (VAPID) + service worker, deployed on **Vercel**

## Architecture

```
UI (app/, components/)  →  services/  →  repositories/  →  Supabase
                              ↑
                    lib/ (pure, tested logic: dates, game rules, parsing, ranking)
```

- **Server Actions** are the write path; each one resolves the session, calls a service, and revalidates.
- **Services** hold product rules (recommendation, rescue, gamification, completion rewards). **Repositories** are the only code that talks to Supabase.
- **Row Level Security** guards every table (`auth.uid() = user_id`). XP lives in an immutable, idempotent ledger.
- **Time is always the person's timezone** (`lib/dates/tz.ts`, plain `Intl`), so "today" is correct on a server running in UTC.
- **AI is optional and isolated.** `TaskParser`, `TaskBreaker` and `RescheduleAdvisor` are interfaces with deterministic implementations; nothing requires a model.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values (see below)
npm run dev                  # http://localhost:3000
```

### 1. Create the database

Create a free project at [supabase.com](https://supabase.com), then apply the SQL files in
[`supabase/migrations`](supabase/migrations) in order (SQL editor, or `supabase db push`).

### 2. Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | everything | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | everything | The publishable (anon) key. Safe for browsers; RLS protects the data |
| `NEXT_PUBLIC_SITE_URL` | auth emails | Where confirmation / reset links point, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | reminders | `node -e "console.log(require('web-push').generateVAPIDKeys())"`. Subject is your site URL or a `mailto:` |
| `CRON_SECRET` | reminders | Shared secret the Vercel cron sends to `/api/notifications/send` |
| `SUPABASE_SERVICE_ROLE_KEY` | reminders, test seeding | Server only. Never expose it |

Without the Supabase values the app explains what's missing at `/setup` instead of crashing.

### 3. Supabase dashboard settings (Authentication)

- **URL Configuration:** set *Site URL* to your deployed URL and add `http://localhost:3000/**` and your deployed URL to *Redirect URLs*.
- **Guest mode:** turn on *Allow anonymous sign-ins* (Authentication → Sign In / Providers).
- **Frictionless sign-up (optional):** turn off *Confirm email* if you don't want people to confirm before using the app.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright). Needs the two test accounts below |
| `npm run seed:test-users` | Creates two throwaway accounts (needs the service role key) |

For the end-to-end tests set `TEST_USER_A_EMAIL` / `TEST_USER_A_PASSWORD` (and the `B` pair for the
isolation test) in `.env.local`. Set `E2E_CHANNEL=msedge` (or `chrome`) to use a browser you already
have instead of downloading Playwright's.

## Deploying to Vercel

1. Import the repo in Vercel.
2. Add the environment variables above (Production and Preview).
3. Push to `main`. Vercel builds and deploys.

`vercel.json` registers a daily cron for reminders (the Hobby plan allows once per day; Pro can run it more often).

## Project layout

```
src/
  app/            routes: landing, auth, onboarding, (dashboard) app shell, focus, api
  components/     ui/ (primitives) · layout/ · today/ · tasks/ · habits/ · gamification/ · marketing/ · motion/
  services/       product rules (recommendation, rescue, review, completion, gamification…)
  repositories/   all Supabase access
  lib/            dates (tz-aware), gamification rules, task parsing/breakdown, validation, supabase clients
supabase/migrations/   schema, RLS policies, triggers
e2e/                   Playwright specs
```

## Notes on data and privacy

- Every row belongs to one person and is protected by RLS; the service role key is used only by the reminder cron.
- The service worker never caches pages or API responses, only static build assets and an offline page.
- Deleting a task is a soft delete with Undo; the immutable XP ledger is never edited.
