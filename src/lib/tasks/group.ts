import { zonedDateString } from "@/lib/dates/tz";
import type { Subtask, Task } from "@/types/task";

/** Plain object (not a Map) so it can cross the server -> client boundary. */
export function groupSubtasks(subtasks: Subtask[]): Record<string, Subtask[]> {
  const grouped: Record<string, Subtask[]> = {};
  for (const subtask of subtasks) {
    (grouped[subtask.taskId] ??= []).push(subtask);
  }
  for (const list of Object.values(grouped)) list.sort((a, b) => a.position - b.position);
  return grouped;
}

export type TaskBucket = "earlier" | "today" | "upcoming" | "someday" | "done";

export const BUCKET_LABELS: Record<TaskBucket, string> = {
  earlier: "Parked, not lost",
  today: "Today",
  upcoming: "Coming up",
  someday: "Someday",
  done: "Done",
};

export const BUCKET_ORDER: TaskBucket[] = ["earlier", "today", "upcoming", "someday", "done"];

export function bucketTask(task: Task, now: Date, timezone: string): TaskBucket {
  if (task.status === "completed") return "done";
  if (!task.dueAt) return "someday";

  const due = new Date(task.dueAt);
  const today = zonedDateString(now, timezone);
  const dueDay = zonedDateString(due, timezone);
  if (dueDay < today) return "earlier";
  if (dueDay === today) return "today";
  return "upcoming";
}

const byDue = (a: Task, b: Task) =>
  (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity);

export function groupTasks(tasks: Task[], now: Date, timezone: string): Record<TaskBucket, Task[]> {
  const buckets: Record<TaskBucket, Task[]> = { earlier: [], today: [], upcoming: [], someday: [], done: [] };
  for (const task of tasks) {
    if (task.status === "cancelled") continue;
    buckets[bucketTask(task, now, timezone)].push(task);
  }
  buckets.earlier.sort(byDue);
  buckets.today.sort(byDue);
  buckets.upcoming.sort(byDue);
  buckets.someday.sort((a, b) => b.importance - a.importance || a.title.localeCompare(b.title));
  buckets.done.sort(
    (a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime(),
  );
  return buckets;
}
