import { AnimatedNumber } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";
import { weeklyProgress } from "@/services/habit-service";
import type { Habit, HabitCompletion, HabitCompletionStatus } from "@/types/habit";
import { isHexColor } from "./habit-color";
import { DAY_LETTERS, shortDateLabel } from "./habit-dates";
import { STATUS_TEXT } from "./habit-day-button";

const MAX_DOTS = 8;

/** One habit on one day: solid when done, half when partly done, a soft dot otherwise. */
function Dot({ color, status, title }: { color: string; status: HabitCompletionStatus | undefined; title: string }) {
  const ink = isHexColor(color) ? color : "var(--brand)";
  const style =
    status === "completed"
      ? { backgroundColor: ink }
      : status === "partial"
        ? { backgroundImage: `linear-gradient(90deg, ${ink} 50%, transparent 50%)`, boxShadow: `inset 0 0 0 1.5px ${ink}` }
        : undefined;

  return <span title={title} style={style} className={cn("block size-2.5 rounded-full", !style && "bg-foreground/10")} />;
}

/**
 * The week at a glance: how many check-ins so far, how many habits are at
 * their target, and a strip showing which habits landed on which day.
 */
export function WeekOverview({
  habits,
  completions,
  weekDates,
  today,
}: {
  habits: Habit[];
  completions: HabitCompletion[];
  weekDates: string[];
  today: string;
}) {
  const rows = habits.map((habit) => ({
    habit,
    progress: weeklyProgress(
      completions.filter((c) => c.habitId === habit.id),
      weekDates,
    ),
  }));
  const checkIns = rows.reduce((sum, row) => sum + row.progress.completedCount, 0);
  const onTarget = rows.filter((row) => row.progress.completedCount >= row.habit.targetCount).length;

  const summary =
    checkIns === 0
      ? "A fresh week. Pick one habit and tap today's circle."
      : onTarget === rows.length
        ? "Every habit is on target. Anything extra is a bonus."
        : onTarget === 0
          ? "Nice start. Every check-in counts, even a partial one."
          : `${onTarget} of ${rows.length} habits on target. Keep going.`;

  return (
    <section aria-label="This week" className="rounded-[2rem] bg-tint-lavender p-6 sm:p-8">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-eyebrow">This week</p>
          <p className="mt-3 flex items-baseline gap-3">
            <span aria-hidden className="font-display text-6xl leading-none sm:text-7xl">
              <AnimatedNumber value={checkIns} />
            </span>
            <span className="sr-only">{checkIns} </span>
            <span className="text-base text-foreground/70">check-in{checkIns === 1 ? "" : "s"}</span>
          </p>
          <p className="mt-3 max-w-sm text-foreground/75">{summary}</p>
        </div>

        <div aria-hidden className="grid grid-cols-7 gap-1 rounded-3xl bg-card/60 p-2 md:w-72">
          {weekDates.map((date, i) => (
            <div
              key={date}
              className={cn(
                "flex min-w-0 flex-col items-center gap-2.5 rounded-2xl py-2.5",
                date === today && "bg-card shadow-soft",
              )}
            >
              <span
                className={cn(
                  "text-[0.7rem] font-medium text-muted-foreground",
                  date === today && "font-semibold text-foreground",
                )}
              >
                {DAY_LETTERS[i]}
              </span>
              <div className="flex flex-col items-center gap-1.5">
                {rows.slice(0, MAX_DOTS).map(({ habit, progress }) => {
                  const status = progress.statusByDate[date];
                  return (
                    <Dot
                      key={habit.id}
                      color={habit.color}
                      status={status}
                      title={`${habit.name} · ${shortDateLabel(date)} · ${STATUS_TEXT[status ?? "none"]}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
