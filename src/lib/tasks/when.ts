import { addDaysToDateString, zonedDateString, zonedTimeToUtc } from "@/lib/dates/tz";

/**
 * Turns the friendly choices (a day, a time, "every day") into the exact
 * moment it's due, in the person's own timezone:
 *  - a time with no day means the next time the clock shows it (today, or tomorrow if it's passed);
 *  - a day with no time means that evening;
 *  - neither means no date at all.
 */
export function dueFrom(
  { date, time }: { date?: string | null; time?: string | null },
  timezone: string,
  now: Date = new Date(),
): string | null {
  if (!date && !time) return null;
  if (date) return zonedTimeToUtc(date, time || "21:00", timezone).toISOString();
  const today = zonedDateString(now, timezone);
  const atToday = zonedTimeToUtc(today, time!, timezone);
  return (atToday.getTime() > now.getTime() ? atToday : zonedTimeToUtc(addDaysToDateString(today, 1), time!, timezone)).toISOString();
}
