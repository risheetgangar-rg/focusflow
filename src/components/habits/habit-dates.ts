/**
 * Tiny date-label helpers for YYYY-MM-DD strings. Built by hand (no Intl) so
 * the server and the browser always produce exactly the same text.
 */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parse(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { month: m, day: d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

/** "Monday" */
export function weekdayName(dateStr: string): string {
  return WEEKDAYS[parse(dateStr).weekday];
}

/** "Mon, Oct 6" */
export function shortDateLabel(dateStr: string): string {
  const { month, day, weekday } = parse(dateStr);
  return `${WEEKDAYS[weekday].slice(0, 3)}, ${MONTHS[month - 1]} ${day}`;
}

/** "Oct 6" */
export function monthDayLabel(dateStr: string): string {
  const { month, day } = parse(dateStr);
  return `${MONTHS[month - 1]} ${day}`;
}

/** "Monday, Oct 6" */
export function longDateLabel(dateStr: string): string {
  return `${weekdayName(dateStr)}, ${monthDayLabel(dateStr)}`;
}

/** M T W T F S S, Monday first (matches getWeekDates). */
export const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
