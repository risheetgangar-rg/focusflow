/**
 * Timezone helpers built on Intl only (no date library). The server runs in
 * UTC on Vercel, so anything that means "the user's today", "6pm", or "this
 * week" must be computed against the user's profile timezone, never against
 * the server's local clock.
 */

export const DEFAULT_TIMEZONE = "UTC";

export function isValidTimezone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimezone(tz: string | null | undefined): string {
  return isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(tz);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    formatterCache.set(tz, formatter);
  }
  return formatter;
}

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(date: Date, tz: string): ZonedParts {
  const parts = formatterFor(tz).formatToParts(date);
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    hour: Number(value("hour")) % 24,
    minute: Number(value("minute")),
    second: Number(value("second")),
    weekday: WEEKDAY_INDEX[value("weekday")] ?? 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD of `date` as seen on a wall calendar in `tz`. */
export function zonedDateString(date: Date, tz: string): string {
  const p = zonedParts(date, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** HH:mm of `date` as seen on a wall clock in `tz`. */
export function zonedTimeString(date: Date, tz: string): string {
  const p = zonedParts(date, tz);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function zonedHour(date: Date, tz: string): number {
  return zonedParts(date, tz).hour;
}

/**
 * A Date whose *local* getters (getHours, getDate, ...) report the wall clock
 * in `tz`. For feeding wall-clock-only logic (quiet hours, text parsing);
 * never compare it against real timestamps.
 */
export function zonedWallClock(date: Date, tz: string): Date {
  const p = zonedParts(date, tz);
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

function offsetMs(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const wholeSeconds = Math.floor(date.getTime() / 1000) * 1000;
  return asUtc - wholeSeconds;
}

/** The instant at which a wall clock in `tz` reads `dateStr` (YYYY-MM-DD) + `timeStr` (HH:mm). */
export function zonedTimeToUtc(dateStr: string, timeStr: string | null | undefined, tz: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const first = offsetMs(new Date(guess), tz);
  let utc = guess - first;
  const second = offsetMs(new Date(utc), tz);
  if (second !== first) utc = guess - second; // landed across a DST boundary
  return new Date(utc);
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Monday-first week containing `reference`, as seven YYYY-MM-DD strings in `tz`. */
export function getWeekDatesInTz(reference: Date, tz: string): string[] {
  const p = zonedParts(reference, tz);
  const today = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  const diffToMonday = p.weekday === 0 ? -6 : 1 - p.weekday;
  return Array.from({ length: 7 }, (_, i) => addDaysToDateString(today, diffToMonday + i));
}

export function zonedDayBoundsUtc(dateStr: string, tz: string): { start: Date; end: Date } {
  return {
    start: zonedTimeToUtc(dateStr, "00:00", tz),
    end: zonedTimeToUtc(addDaysToDateString(dateStr, 1), "00:00", tz),
  };
}

export function isSameZonedDay(a: Date, b: Date, tz: string): boolean {
  return zonedDateString(a, tz) === zonedDateString(b, tz);
}
