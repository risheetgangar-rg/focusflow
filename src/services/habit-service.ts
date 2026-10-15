import { DEFAULT_TIMEZONE, getWeekDatesInTz, zonedDateString } from "@/lib/dates/tz";
import type { HabitCompletion, HabitCompletionStatus } from "@/types/habit";

export function getWeekDates(reference: Date, timezone: string = DEFAULT_TIMEZONE): string[] {
  return getWeekDatesInTz(reference, timezone);
}

export interface WeeklyProgress {
  completedCount: number;
  weekDates: string[];
  statusByDate: Record<string, HabitCompletionStatus | undefined>;
}

/** Both "completed" and "partial" count toward progress — effort counts, per spec's no-punishment stance. */
export function weeklyProgress(
  completions: HabitCompletion[],
  weekDates: string[],
): WeeklyProgress {
  const statusByDate: Record<string, HabitCompletionStatus | undefined> = {};
  for (const date of weekDates) statusByDate[date] = undefined;
  for (const c of completions) {
    if (Object.hasOwn(statusByDate, c.date)) statusByDate[c.date] = c.status;
  }

  const completedCount = weekDates.filter(
    (d) => statusByDate[d] === "completed" || statusByDate[d] === "partial",
  ).length;

  return { completedCount, weekDates, statusByDate };
}

export function todayDateString(
  reference: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE,
): string {
  return zonedDateString(reference, timezone);
}
