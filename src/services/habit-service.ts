import type { HabitCompletion, HabitCompletionStatus } from "@/types/habit";

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeekDates(reference: Date): string[] {
  const day = reference.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(reference);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return toLocalDateString(d);
  });
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

export function todayDateString(reference: Date = new Date()): string {
  return toLocalDateString(reference);
}
