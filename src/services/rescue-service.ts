import { isOverdue } from "@/lib/dates/overdue";
import type { Task } from "@/types/task";

const OVERDUE_THRESHOLD = 3;
const POSTPONED_THRESHOLD = 3;

/** 3+ overdue tasks, or any single task postponed repeatedly — matches the spec's trigger. */
export function needsRescue(tasks: Task[], now: Date = new Date()): boolean {
  const overdueCount = tasks.filter((t) => isOverdue(t.dueAt, t.status, now)).length;
  if (overdueCount >= OVERDUE_THRESHOLD) return true;
  return tasks.some((t) => t.status === "pending" && t.postponedCount >= POSTPONED_THRESHOLD);
}

/**
 * A small, doable recovery set — quickest tasks first, so the first win
 * comes fast. Falls back to the shortest-title tasks when nothing has an
 * estimate, rather than an arbitrary order.
 */
export function selectRecoverySet(tasks: Task[], now: Date = new Date(), limit = 3): Task[] {
  const candidates = tasks.filter(
    (t) => t.status === "pending" && (isOverdue(t.dueAt, t.status, now) || t.postponedCount > 0),
  );

  return [...candidates]
    .sort((a, b) => {
      const aTime = a.estimatedMinutes ?? Infinity;
      const bTime = b.estimatedMinutes ?? Infinity;
      if (aTime !== bTime) return aTime - bTime;
      return a.title.length - b.title.length;
    })
    .slice(0, limit);
}

export function restOfBacklog(tasks: Task[], recoverySet: Task[]): Task[] {
  const recoveryIds = new Set(recoverySet.map((t) => t.id));
  return tasks.filter((t) => t.status === "pending" && !recoveryIds.has(t.id));
}
