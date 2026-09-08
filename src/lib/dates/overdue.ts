import type { TaskStatus } from "@/types/task";

export function isOverdue(
  dueAt: string | null,
  status: TaskStatus,
  now: Date = new Date(),
): boolean {
  if (status !== "pending" || !dueAt) return false;
  return new Date(dueAt).getTime() < now.getTime();
}

export function isDueToday(dueAt: string | null, now: Date = new Date()): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}
