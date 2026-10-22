import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AddTaskBox } from "@/components/today/add-task-box";
import { PretendAwayButton } from "@/components/today/pretend-away-button";
import { SessionPing } from "@/components/today/session-ping";
import { TodayCard, type CardTask } from "@/components/today/today-card";
import { UndoMoveBar, WelcomeBackMode } from "@/components/today/welcome-back-mode";
import { requireSession } from "@/lib/auth/session";
import { zonedDateString, zonedHour, zonedTimeToUtc } from "@/lib/dates/tz";
import { groupSubtasks } from "@/lib/tasks/group";
import { TODAY_LIMIT, billAmount, firstStepFor, rankForToday, reasonFor } from "@/lib/tasks/personal";
import {
  UNDO_HOURS,
  calendarDaysBetween,
  pickOneWin,
  waitingTasks,
  welcomeBackStart,
} from "@/lib/welcome-back/rules";
import { updateProfile } from "@/repositories/profile-repository";
import * as taskRepo from "@/repositories/task-repository";
import { latestUndoableShift } from "@/repositories/welcome-repository";
import type { Subtask, Task } from "@/types/task";

export const metadata: Metadata = { title: "Today" };

function greeting(hour: number) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function toCard(task: Task, steps: Subtask[], now: Date, tz: string): CardTask {
  return { task, reason: reasonFor(task, now, tz), firstStep: firstStepFor(task, steps), amount: billAmount(task) };
}

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus } = await searchParams;
  const { supabase, userId, profile, timezone } = await requireSession();
  const now = new Date();

  // Open tasks, plus anything finished since midnight for the "Done today" list.
  const midnight = zonedTimeToUtc(zonedDateString(now, timezone), "00:00", timezone);
  const tasks = await taskRepo.listVisibleTasks(supabase, userId, midnight);
  const doneToday = tasks.filter((t) => t.status === "completed");
  const pending = tasks.filter((t) => t.status === "pending");
  const steps = groupSubtasks(
    await taskRepo.listSubtasksForTasks(
      supabase,
      pending.map((t) => t.id),
    ),
  );
  const card = (t: Task) => toCard(t, steps[t.id] ?? [], now, timezone);

  /* Coming back after a gap: one small win, everything else parked */
  const late = waitingTasks(pending, now);
  const awayStart =
    pending.length > 0
      ? welcomeBackStart(
          {
            lastSeenAt: profile.lastSeenAt,
            awaySince: profile.awaySince,
            welcomeDismissedOn: profile.welcomeDismissedOn,
            waitingCount: late.length,
          },
          now,
          timezone,
        )
      : null;
  const seenRecently = profile.lastSeenAt && now.getTime() - new Date(profile.lastSeenAt).getTime() < 5 * 60_000;
  if (awayStart !== profile.awaySince || !seenRecently) {
    await updateProfile(supabase, userId, { lastSeenAt: now.toISOString(), awaySince: awayStart });
  }
  const recentMove = await latestUndoableShift(supabase, userId, new Date(now.getTime() - UNDO_HOURS * 3_600_000));

  if (awayStart && !focus) {
    // The longer they were away, the smaller the task: the smallest first, then the next smallest.
    const first = pickOneWin(pending, now);
    const rest = rankForToday(pending, now, profile.focusAreas).filter((t) => t.id !== first?.id);
    // No numbers on the comeback screen: drop the minutes from the reason.
    const items = [first, ...rest]
      .filter((t): t is Task => Boolean(t))
      .slice(0, TODAY_LIMIT)
      .map(card)
      .map((c) => ({ ...c, reason: c.reason.replace(/ · \d+ min$/, "").replace(/^No rush$/, "Small one to start") }));
    return (
      <div className="mx-auto w-full max-w-3xl">
        <SessionPing />
        <WelcomeBackMode
          items={items}
          nowIso={now.toISOString()}
          daysAway={calendarDaysBetween(new Date(awayStart), now, timezone)}
          canMove={late.some((t) => !t.fixedDate)}
          undoShiftId={recentMove?.id ?? null}
        />
      </div>
    );
  }

  /* A normal day: one card, at most three tasks, the rest quietly "Later" */
  const ranked = rankForToday(pending, now, profile.focusAreas);
  const focused = focus ? pending.find((t) => t.id === focus) : undefined;
  const ordered = focused ? [focused, ...ranked.filter((t) => t.id !== focused.id)] : ranked;
  const items = ordered.slice(0, TODAY_LIMIT).map(card);
  const firstName = profile.displayName?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <SessionPing />
      {recentMove && <UndoMoveBar shiftId={recentMove.id} />}

      <header className="animate-rise">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          {greeting(zonedHour(now, timezone))}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
      </header>

      <TodayCard key="today" items={items} nowIso={now.toISOString()} autoStartId={focused?.id} />

      {ordered.length > TODAY_LIMIT && (
        <Link href="/tasks" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          Later <ArrowRight size={14} />
        </Link>
      )}

      {doneToday.length > 0 && (
        <section aria-labelledby="done-today" className="rounded-3xl border-2 border-border bg-tint-mint/60 px-5 py-4">
          <h2 id="done-today" className="text-eyebrow text-muted-foreground">
            Done today
          </h2>
          <ul className="mt-2 space-y-1.5">
            {doneToday.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-lime text-primary">
                  <Check size={12} strokeWidth={3.5} />
                </span>
                <span className="line-through decoration-foreground/40">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AddTaskBox />

      <div className="flex justify-center pt-6">
        <PretendAwayButton />
      </div>
    </div>
  );
}
