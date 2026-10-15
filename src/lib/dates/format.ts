import { zonedDateString, zonedTimeString } from "@/lib/dates/tz";

export type DueTone = "past" | "today" | "soon" | "later";

export interface DueDescription {
  label: string;
  tone: DueTone;
}

function dayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function formatClock(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(date);
}

function formatDay(date: Date, tz: string, withWeekday: boolean): string {
  return new Intl.DateTimeFormat("en-US", {
    ...(withWeekday ? { weekday: "short" } : {}),
    month: "short",
    day: "numeric",
    timeZone: tz,
  }).format(date);
}

/**
 * Plain-language due date: "Today · 6:00 PM", "Tomorrow", "Friday", "Oct 14".
 * Past dates read as a neutral fact ("Was due Mon, Oct 6"), never an alarm.
 * A date picked without a time is stored as local midnight and shown without a clock.
 */
export function describeDue(dueIso: string, now: Date, tz: string): DueDescription {
  const due = new Date(dueIso);
  const diffDays = dayNumber(zonedDateString(due, tz)) - dayNumber(zonedDateString(now, tz));
  const hasTime = zonedTimeString(due, tz) !== "00:00";
  const clock = hasTime ? ` · ${formatClock(due, tz)}` : "";

  if (due.getTime() < now.getTime()) {
    if (diffDays === 0) return { label: `Earlier today${clock}`, tone: "past" };
    if (diffDays === -1) return { label: "Was due yesterday", tone: "past" };
    return { label: `Was due ${formatDay(due, tz, true)}`, tone: "past" };
  }
  if (diffDays === 0) return { label: `Today${clock}`, tone: "today" };
  if (diffDays === 1) return { label: `Tomorrow${clock}`, tone: "soon" };
  if (diffDays < 7) {
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: tz }).format(due);
    return { label: `${weekday}${clock}`, tone: "soon" };
  }
  return { label: formatDay(due, tz, false), tone: "later" };
}
