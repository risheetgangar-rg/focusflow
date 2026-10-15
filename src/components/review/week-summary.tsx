import Link from "next/link";
import { Sparkles } from "lucide-react";
import { habitStyle } from "@/components/habits/habit-color";
import { ProgressRing } from "@/components/motion/progress-ring";
import { weeklyProgress } from "@/services/habit-service";
import type { Habit, HabitCompletion } from "@/types/habit";

export interface UnstuckSummary {
  /** Times the app was opened with something waiting. */
  sessions: number;
  /** Of those, how many led to starting or finishing something. */
  unstuck: number;
}

function unstuckLine({ sessions, unstuck }: UnstuckSummary): string {
  if (unstuck === 0) return "Starting felt hard this week. That's okay. One small task tomorrow is plenty.";
  if (unstuck === sessions) {
    return sessions === 1
      ? "You got unstuck the one time you needed to this week."
      : `You got unstuck ${unstuck} of ${sessions} times this week. Every time.`;
  }
  return `You got unstuck ${unstuck} of ${sessions} times this week.`;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4 sm:p-5">
      <p className="font-display text-4xl leading-none sm:text-5xl">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** This week in one calm panel: a ring per habit, focus sessions, important tasks, and the unstuck line. */
export function WeekSummary({
  rangeLabel,
  habits,
  completions,
  weekDates,
  focusSessions,
  importantDone,
  unstuck,
}: {
  rangeLabel: string;
  habits: Habit[];
  completions: HabitCompletion[];
  weekDates: string[];
  focusSessions: number;
  importantDone: number;
  unstuck: UnstuckSummary | null;
}) {
  return (
    <section
      aria-labelledby="week-heading"
      className="rounded-[2rem] border border-border/80 bg-card p-6 shadow-soft sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="week-heading" className="font-display text-3xl">
          This week
        </h2>
        <p className="text-sm text-muted-foreground">{rangeLabel}</p>
      </div>

      {habits.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-5">
          {habits.map((habit) => {
            const { completedCount } = weeklyProgress(
              completions.filter((c) => c.habitId === habit.id),
              weekDates,
            );
            return (
              <li key={habit.id} style={habitStyle(habit.color)} className="flex w-20 flex-col items-center gap-2 text-center">
                <ProgressRing fraction={completedCount / habit.targetCount} size={64} stroke={7}>
                  <span aria-hidden className="font-display text-lg leading-none tabular-nums">
                    {completedCount}/{habit.targetCount}
                  </span>
                </ProgressRing>
                <span className="line-clamp-2 text-sm leading-tight break-words">{habit.name}</span>
                <span className="sr-only">
                  {completedCount} of {habit.targetCount} days this week
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 text-muted-foreground">
          No habits yet. Add one when you&apos;re ready, and it will show up here.{" "}
          <Link href="/habits" className="font-medium text-foreground underline underline-offset-4 hover:text-brand">
            Open habits
          </Link>
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        <Stat value={focusSessions} label={focusSessions === 1 ? "focus session" : "focus sessions"} />
        <Stat value={importantDone} label={importantDone === 1 ? "important task done" : "important tasks done"} />
      </div>

      {unstuck && unstuck.sessions > 0 && (
        <p className="mt-4 flex items-start gap-3 rounded-2xl bg-tint-lavender px-4 py-3.5 text-sm text-foreground/85">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          {unstuckLine(unstuck)}
        </p>
      )}
    </section>
  );
}
