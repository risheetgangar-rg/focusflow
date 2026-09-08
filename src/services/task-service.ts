import type { SupabaseClient } from "@supabase/supabase-js";
import { nextOccurrence } from "@/lib/dates/recurrence";
import * as taskRepo from "@/repositories/task-repository";
import type { Task } from "@/types/task";

export async function completeTask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
): Promise<Task> {
  const task = await taskRepo.getTask(supabase, taskId);
  if (!task) throw new Error("Task not found");

  const completed = await taskRepo.setTaskStatus(
    supabase,
    taskId,
    "completed",
    new Date().toISOString(),
  );

  if (task.recurrenceRule) {
    const base = task.dueAt ? new Date(task.dueAt) : new Date();
    const next = nextOccurrence(task.recurrenceRule, base);
    await taskRepo.createTask(supabase, userId, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      importance: task.importance,
      urgency: task.urgency,
      friction: task.friction,
      estimatedMinutes: task.estimatedMinutes,
      dueAt: next.toISOString(),
      recurrenceRule: task.recurrenceRule,
      source: "recurring",
    });
  }

  return completed;
}

export async function undoCompleteTask(
  supabase: SupabaseClient,
  taskId: string,
): Promise<Task> {
  return taskRepo.setTaskStatus(supabase, taskId, "pending", null);
}

export async function snoozeTask(
  supabase: SupabaseClient,
  taskId: string,
  minutes: number,
): Promise<Task> {
  const scheduledAt = new Date(Date.now() + minutes * 60_000).toISOString();
  return taskRepo.rescheduleTask(supabase, taskId, scheduledAt, undefined, false);
}

export type RescheduleTarget = "later_today" | "tomorrow" | "this_week" | "custom";

export function resolveRescheduleDate(target: RescheduleTarget, customDate?: Date): Date {
  const now = new Date();
  switch (target) {
    case "later_today": {
      const d = new Date(now);
      d.setHours(d.getHours() + 3);
      return d;
    }
    case "tomorrow": {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    }
    case "this_week": {
      const d = new Date(now);
      d.setDate(d.getDate() + (7 - d.getDay()));
      d.setHours(9, 0, 0, 0);
      return d;
    }
    case "custom":
      if (!customDate) throw new Error("customDate is required for a custom reschedule");
      return customDate;
  }
}
