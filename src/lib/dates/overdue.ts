import { DEFAULT_TIMEZONE, zonedDateString } from "@/lib/dates/tz";
import type { TaskStatus } from "@/types/task";

export function isOverdue(
  dueAt: string | null,
  status: TaskStatus,
  now: Date = new Date(),
): boolean {
  if (status !== "pending" || !dueAt) return false;
  return new Date(dueAt).getTime() < now.getTime();
}

/** Is `dueAt` on the same calendar day as `now`, as seen in `timezone`? */
export function isDueToday(
  dueAt: string | null,
  now: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE,
): boolean {
  if (!dueAt) return false;
  return zonedDateString(new Date(dueAt), timezone) === zonedDateString(now, timezone);
}
