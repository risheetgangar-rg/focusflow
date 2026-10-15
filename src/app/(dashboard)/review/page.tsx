import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { longDateLabel, monthDayLabel } from "@/components/habits/habit-dates";
import { Reveal } from "@/components/motion/primitives";
import { DaySummary } from "@/components/review/day-summary";
import { ReflectionForm } from "@/components/review/reflection-form";
import { RescheduleRemaining } from "@/components/review/reschedule-remaining";
import { WeekSummary } from "@/components/review/week-summary";
import { computeUnstuckRate } from "@/lib/analytics/unstuck";
import { requireSession } from "@/lib/auth/session";
import { zonedDayBoundsUtc } from "@/lib/dates/tz";
import * as habitRepo from "@/repositories/habit-repository";
import * as taskRepo from "@/repositories/task-repository";
import { listRecentEvents } from "@/services/analytics-service";
import { getWeekDates, todayDateString } from "@/services/habit-service";
import { computeDailyStats, computeWeeklyStats, getReflection } from "@/services/review-service";

export const metadata: Metadata = { title: "Evening review" };

const DAY_MS = 86_400_000;

/** Optional extras (stats, insights) should never take the whole page down with them. */
async function orFallback<T>(work: Promise<T>, fallback: T): Promise<T> {
  try {
    return await work;
  } catch {
    return fallback;
  }
}

async function countCompletedFocusSessions(
  supabase: SupabaseClient,
  userId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const { count, error } = await supabase
    .from("focus_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("started_at", from.toISOString())
    .lt("started_at", to.toISOString());
  return error ? 0 : (count ?? 0);
}

export default async function ReviewPage() {
  const { supabase, userId, timezone } = await requireSession();

  const now = new Date();
  const today = todayDateString(now, timezone);
  const weekDates = getWeekDates(now, timezone);
  const [weekStart, weekEnd] = [weekDates[0], weekDates[6]];
  const weekFrom = zonedDayBoundsUtc(weekStart, timezone).start;
  const weekTo = zonedDayBoundsUtc(weekEnd, timezone).end;

  const [tasks, habits, focusSessions, events, reflection] = await Promise.all([
    taskRepo.listTasks(supabase, userId),
    habitRepo.listHabits(supabase, userId),
    countCompletedFocusSessions(supabase, userId, weekFrom, weekTo),
    orFallback(listRecentEvents(supabase, userId, new Date(now.getTime() - 7 * DAY_MS).toISOString()), []),
    getReflection(supabase, userId, today),
  ]);
  const completions = await habitRepo.listCompletionsInRange(
    supabase,
    habits.map((h) => h.id),
    weekStart,
    weekEnd,
  );

  const daily = computeDailyStats(tasks, now, timezone);
  const weekly = computeWeeklyStats(tasks, focusSessions, weekStart, weekEnd, timezone);
  const unstuck = computeUnstuckRate(events);
  const remainingIds = tasks.filter((t) => t.status === "pending").map((t) => t.id);

  const sentence =
    daily.completedCount === 0
      ? "A quiet day. That's allowed."
      : `You finished ${daily.completedCount} ${daily.completedCount === 1 ? "thing" : "things"} today. That counts.`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <Reveal>
        <header className="max-w-2xl space-y-3">
          <p className="text-eyebrow">{longDateLabel(today)}</p>
          <h1 className="font-display text-4xl sm:text-5xl">
            Evening <span className="italic">review</span>
          </h1>
          <p className="text-muted-foreground">{sentence}</p>
        </header>
      </Reveal>

      <DaySummary completed={daily.completedCount} moved={daily.rescheduledCount} open={daily.remainingCount} />

      <div className="grid items-start gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <Reveal inView>
            <WeekSummary
              rangeLabel={`${monthDayLabel(weekStart)} – ${monthDayLabel(weekEnd)}`}
              habits={habits}
              completions={completions}
              weekDates={weekDates}
              focusSessions={weekly.focusSessionCount}
              importantDone={weekly.importantCompletedCount}
              unstuck={unstuck}
            />
          </Reveal>
        </div>

        <div className="space-y-6 lg:col-span-2 lg:space-y-8">
          <Reveal inView>
            <RescheduleRemaining taskIds={remainingIds} />
          </Reveal>

          <Reveal inView>
            <section
              aria-labelledby="reflection-heading"
              className="rounded-[2rem] border border-border/80 bg-card p-6 shadow-soft sm:p-8"
            >
              <h2 id="reflection-heading" className="mb-5 font-display text-3xl">
                Before you go
              </h2>
              <ReflectionForm initialReflection={reflection} />
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
