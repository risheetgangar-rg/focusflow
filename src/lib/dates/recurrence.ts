import type { RecurrenceRule } from "@/types/task";

/** How many days until the next one: twice a week is every 3-4 days, three times every 2-3. */
const DAYS: Record<Exclude<RecurrenceRule, "monthly">, number> = {
  daily: 1,
  twice_weekly: 3,
  thrice_weekly: 2,
  weekly: 7,
};

export function nextOccurrence(rule: RecurrenceRule, from: Date): Date {
  const next = new Date(from);
  if (rule === "monthly") next.setMonth(next.getMonth() + 1);
  else next.setDate(next.getDate() + DAYS[rule]);
  return next;
}

export const REPEAT_LABEL: Record<RecurrenceRule, string> = {
  daily: "Every day",
  twice_weekly: "2× a week",
  thrice_weekly: "3× a week",
  weekly: "Every week",
  monthly: "Every month",
};
