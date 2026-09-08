import type { RecurrenceRule } from "@/types/task";

export function nextOccurrence(rule: RecurrenceRule, from: Date): Date {
  const next = new Date(from);
  switch (rule) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
