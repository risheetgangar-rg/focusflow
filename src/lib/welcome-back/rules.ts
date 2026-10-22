import { isOverdue } from "@/lib/dates/overdue";
import { addDaysToDateString, zonedDateString } from "@/lib/dates/tz";
import type { Task } from "@/types/task";

const DAY_MS = 86_400_000;
/** Away this many calendar days (or more) and the home screen switches to "Welcome back". */
export const AWAY_DAYS = 2;
/** ...or this many tasks waiting past their date. */
export const WAITING_TASKS = 3;
/** Undo stays available this long after moving things forward. */
export const UNDO_HOURS = 24;

/** Whole calendar days between two moments, in the person's own timezone. */
export function calendarDaysBetween(from: Date, to: Date, tz: string): number {
  const a = Date.parse(`${zonedDateString(from, tz)}T00:00:00Z`);
  const b = Date.parse(`${zonedDateString(to, tz)}T00:00:00Z`);
  return Math.round((b - a) / DAY_MS);
}

export function waitingTasks(tasks: Task[], now: Date): Task[] {
  return tasks.filter((t) => isOverdue(t.dueAt, t.status, now));
}

/**
 * Should opening the app start (or continue) welcome-back mode?
 * Returns the moment the absence began, or null for a normal day.
 */
export function welcomeBackStart(
  input: {
    lastSeenAt: string | null;
    awaySince: string | null;
    welcomeDismissedOn: string | null;
    waitingCount: number;
  },
  now: Date,
  tz: string,
): string | null {
  if (input.awaySince) return input.awaySince;
  const today = zonedDateString(now, tz);
  if (input.lastSeenAt && calendarDaysBetween(new Date(input.lastSeenAt), now, tz) >= AWAY_DAYS) return input.lastSeenAt;
  if (input.waitingCount >= WAITING_TASKS && input.welcomeDismissedOn !== today) return input.lastSeenAt ?? now.toISOString();
  return null;
}

function effort(task: Task): number {
  return task.estimatedMinutes ?? task.friction * 10;
}

function stakes(task: Task, now: Date): number {
  const overdue = isOverdue(task.dueAt, task.status, now) ? 2 : 0;
  return task.importance + task.urgency + overdue;
}

/** The "1 win": the lowest-effort task, with the highest stakes breaking ties. Never a boss task. */
export function pickOneWin(tasks: Task[], now: Date): Task | null {
  const candidates = tasks.filter((t) => t.status === "pending" && !t.isBoss);
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => effort(a) - effort(b) || stakes(b, now) - stakes(a, now))[0];
}

export interface DateChange {
  taskId: string;
  title: string;
  oldDueAt: string | null;
  newDueAt: string | null;
  oldScheduledAt: string | null;
  newScheduledAt: string | null;
}

function shift(iso: string | null, days: number, floor: Date): string | null {
  if (!iso) return null;
  let moved = new Date(iso).getTime() + days * DAY_MS;
  // Never land in the past: keep stepping a day at a time, so the time of day stays the same.
  while (moved < floor.getTime()) moved += DAY_MS;
  return new Date(moved).toISOString();
}

/**
 * "I was away": everything that went past its date while they were gone moves
 * forward by the days they were away. Tasks that aren't late are left alone.
 */
export function planMoveForward(tasks: Task[], days: number, now: Date): DateChange[] {
  const floor = now;
  return waitingTasks(tasks, now).map((t) => ({
    taskId: t.id,
    title: t.title,
    oldDueAt: t.dueAt,
    newDueAt: shift(t.dueAt, days, floor),
    oldScheduledAt: t.scheduledAt,
    newScheduledAt: shift(t.scheduledAt, days, floor),
  }));
}

export type TimeLabel = "Now" | "Soon" | "Whenever";

/** Now = today or already late; Soon = within a week; Whenever = no date or later. */
export function timeLabel(task: Pick<Task, "dueAt">, now: Date, tz: string): TimeLabel {
  if (!task.dueAt) return "Whenever";
  const today = zonedDateString(now, tz);
  const due = zonedDateString(new Date(task.dueAt), tz);
  if (due <= today) return "Now";
  if (due <= addDaysToDateString(today, 7)) return "Soon";
  return "Whenever";
}
