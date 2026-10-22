import type { SupabaseClient } from "@supabase/supabase-js";
import { nextOccurrence } from "@/lib/dates/recurrence";
import {
  DEFAULT_TIMEZONE,
  addDaysToDateString,
  zonedDateString,
  zonedParts,
  zonedTimeToUtc,
} from "@/lib/dates/tz";
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

  // Completing twice (complete, undo, complete) must not stack up copies of tomorrow's task.
  if (task.recurrenceRule && !(await taskRepo.findRecurringChild(supabase, taskId))) {
    // From whichever is later, its date or now, so a late finish never schedules the next one in the past.
    const base = new Date(Math.max(task.dueAt ? Date.parse(task.dueAt) : 0, Date.now()));
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
      parentTaskId: taskId,
      kind: task.kind,
      taskType: task.taskType,
      mustDo: task.mustDo,
      source: "recurring",
    });
  }

  return completed;
}

export async function undoCompleteTask(
  supabase: SupabaseClient,
  taskId: string,
): Promise<Task> {
  const reopened = await taskRepo.setTaskStatus(supabase, taskId, "pending", null);
  if (reopened.recurrenceRule) await taskRepo.deleteUntouchedRecurringChildren(supabase, taskId);
  return reopened;
}

/**
 * "Move it": the task is now for that day, so its plan and its due date both
 * follow. (Moving only the plan would leave it sitting in "from earlier".)
 */
export async function moveTask(supabase: SupabaseClient, taskId: string, when: Date): Promise<Task> {
  const iso = when.toISOString();
  return taskRepo.rescheduleTask(supabase, taskId, iso, iso);
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

const LATE_EVENING = "21:30";
const MORNING = "09:00";

/**
 * Resolves a gentle "move it" choice to a real instant in the user's own
 * timezone: later today (never past bedtime), tomorrow morning, or the
 * coming weekend.
 */
export function resolveRescheduleDate(
  target: RescheduleTarget,
  customDate?: Date,
  timezone: string = DEFAULT_TIMEZONE,
  now: Date = new Date(),
): Date {
  const today = zonedDateString(now, timezone);

  switch (target) {
    case "later_today": {
      const threeHours = new Date(now.getTime() + 3 * 3_600_000);
      if (zonedDateString(threeHours, timezone) === today) return threeHours;
      const evening = zonedTimeToUtc(today, LATE_EVENING, timezone);
      return evening.getTime() > now.getTime() + 15 * 60_000 ? evening : new Date(now.getTime() + 15 * 60_000);
    }
    case "tomorrow":
      return zonedTimeToUtc(addDaysToDateString(today, 1), MORNING, timezone);
    case "this_week": {
      const { weekday } = zonedParts(now, timezone);
      const daysUntilSunday = weekday === 0 ? 7 : 7 - weekday;
      return zonedTimeToUtc(addDaysToDateString(today, daysUntilSunday), MORNING, timezone);
    }
    case "custom":
      if (!customDate) throw new Error("customDate is required for a custom reschedule");
      return customDate;
  }
}
