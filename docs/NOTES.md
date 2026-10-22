# Unstuck – notes on the current app (Step 1 of the build plan)

Written before changing anything, so we know what exists today.

## Pages

| Address | What it is |
| --- | --- |
| `/` | Landing page (big "GET UNSTUCK." headline, card wheel, flowing lines) |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Sign-in screens, including "Continue as guest" |
| `/onboarding` | First-time questions (name, what you want help with, game layer) |
| `/setup` | Shown only if the app isn't connected to the database |
| `/today` | Home: welcome-back screen, "What's next" card, "On your plate", habits, quests, done ring |
| `/tasks` | Every task, with search and filters |
| `/habits` | Habits with weekly check-ins |
| `/focus` | "What should I do now?" picker (a separate Focus page) |
| `/focus/[task]` | Full-screen focus timer for one task |
| `/brain-dump` | Type everything, review as Task / Note / Skip, then save |
| `/voice` | Speak instead of typing; feeds into brain dump |
| `/review` | Evening review |
| `/rescue` | "Things piled up" recovery page |
| `/rewards` | XP, levels, quests, achievements |
| `/settings` | Name, timezone, themes, game layer (off / light / full), guest upgrade |
| `/offline` | Shown when there's no internet |

## Where tasks are saved

- In the Supabase database, table `tasks` (steps are in `task_subtasks`).
- Code that reads and writes them: `src/repositories/task-repository.ts`.
- Guests are real (anonymous) Supabase accounts, so their tasks are saved the same way.
- Sample tasks for guests are created in `src/services/demo-service.ts`.

## Where the game layer (XP, levels, streaks, quests) lives

- Rules and numbers: `src/lib/gamification/rules.ts`
- Awarding XP: `src/services/gamification-service.ts`, called from `src/services/completion-service.ts`
- Database access: `src/repositories/gamification-repository.ts`
- On screen: the level card in the sidebar (`src/components/gamification/level-card.tsx`), the "Lv" chip on phones
  (`src/components/layout/mobile-top-bar.tsx`), the quest card on Today, XP pop-ups
  (`src/components/gamification/celebration-provider.tsx`), the `/rewards` page (`src/components/rewards/`),
  and wording on the landing page (`src/components/marketing/`)
- It can already be switched off per person: Settings → game layer → Off (`gamificationMode = "off"`).
- "Momentum" is the app's streak-like counter (resets after 3 hours away).

## Brain dump

- Page: `src/app/(dashboard)/brain-dump/page.tsx`
- Screen: `src/components/brain-dump/brain-dump-form.tsx`
- Server side: `src/app/(dashboard)/brain-dump/actions.ts`; optional AI reader in `src/lib/ai/claude-parser.ts`
  (only runs if an AI key is added)

## The "pretend I was away" button

- Button: `src/components/today/pretend-away-button.tsx`, shown at the bottom of Today
- What it does: `pretendAwayAction` in `src/app/(dashboard)/today/welcome-actions.ts`
- The comeback screen itself: `src/components/today/welcome-back-mode.tsx`; rules in `src/lib/welcome-back/rules.ts`

## Things that differ from the plan

- Today currently shows several boxes (ring, plate, habits, quests). The plan wants one card.
- There is a separate `/focus` page and menu item. The plan puts focus inside Today.
- Urgency today is Now / Soon / Whenever by calendar day; the plan wants 24 hours / 3 days and a starred "Must do".
- Late tasks are labelled "From earlier" with a yellow badge; the plan wants a calm "Parked" label.
