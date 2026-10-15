import { monthDayLabel, weekdayName } from "@/components/habits/habit-dates";
import { addDaysToDateString, zonedDateString } from "@/lib/dates/tz";

/**
 * "Today", "Yesterday", a weekday for the rest of the past week, otherwise
 * "Oct 3". Always worked out on the server in the person's timezone, so the
 * browser never has to guess (and can never disagree).
 */
export function relativeDay(iso: string, today: string, timezone: string): string {
  const day = zonedDateString(new Date(iso), timezone);
  if (day === today) return "Today";
  if (day === addDaysToDateString(today, -1)) return "Yesterday";
  for (let back = 2; back < 7; back++) {
    if (day === addDaysToDateString(today, -back)) return weekdayName(day);
  }
  return monthDayLabel(day);
}

/** "Oct 6", in the person's timezone. */
export function dayLabel(iso: string, timezone: string): string {
  return monthDayLabel(zonedDateString(new Date(iso), timezone));
}
