"use server";

import { revalidatePath } from "next/cache";
import { getSession, type Session } from "@/lib/auth/session";
import { zonedTimeToUtc } from "@/lib/dates/tz";
import { bossStatus } from "@/lib/tasks/boss";
import {
  breakdownStepsSchema,
  quickTaskSchema,
  subtaskTitleSchema,
  taskFormSchema,
} from "@/lib/validation/task";
import * as taskRepo from "@/repositories/task-repository";
import { track } from "@/services/analytics-service";
import { completeTaskWithRewards, EMPTY_OUTCOME } from "@/services/completion-service";
import * as taskService from "@/services/task-service";
import type { RescheduleTarget } from "@/services/task-service";
import type { CompletionOutcome } from "@/types/gamification";
import type { RecurrenceRule, TaskPriority } from "@/types/task";

export interface TaskFormState {
  error?: string;
  message?: string;
}

const SIGN_IN_AGAIN = "Please sign in again.";

function refresh() {
  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/focus");
}

async function withSession<T>(fallback: T, run: (session: Session) => Promise<T>): Promise<T> {
  const session = await getSession();
  if (!session) return fallback;
  return run(session);
}

export async function saveTask(
  taskId: string | null,
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const parsed = taskFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Something looks off. Check the form." };
  }

  const session = await getSession();
  if (!session) return { error: SIGN_IN_AGAIN };
  const { supabase, userId, timezone } = session;

  const v = parsed.data;
  const input = {
    title: v.title,
    description: v.description || null,
    priority: v.priority as TaskPriority,
    importance: v.importance,
    urgency: v.urgency,
    friction: v.friction,
    estimatedMinutes: v.estimatedMinutes === "" ? null : Number(v.estimatedMinutes),
    dueAt: v.dueDate ? zonedTimeToUtc(v.dueDate, v.dueTime, timezone).toISOString() : null,
    scheduledAt: v.scheduledDate
      ? zonedTimeToUtc(v.scheduledDate, v.scheduledTime, timezone).toISOString()
      : null,
    recurrenceRule: v.recurrenceRule === "none" ? null : (v.recurrenceRule as RecurrenceRule),
    isBoss: session.profile.gamificationMode === "full" ? v.isBoss : false,
    taskType: v.taskType,
    mustDo: v.mustDo,
    fixedDate: v.fixedDate,
  };

  if (taskId) {
    await taskRepo.updateTask(supabase, taskId, input);
  } else {
    const created = await taskRepo.createTask(supabase, userId, input);
    await track(supabase, userId, "task_created", { task_id: created.id, source: "manual" });
  }

  refresh();
  return { message: "Saved." };
}

/** One-line capture. The preview the user saw (title/date/time) is exactly what's saved. */
export async function createQuickTaskAction(
  input: unknown,
): Promise<{ ok: true; taskId: string } | { ok: false; error: string }> {
  const parsed = quickTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Type something first." };

  const session = await getSession();
  if (!session) return { ok: false, error: SIGN_IN_AGAIN };
  const { supabase, userId, timezone } = session;
  const q = parsed.data;

  const task = await taskRepo.createTask(supabase, userId, {
    title: q.title,
    priority: q.priority ?? "medium",
    dueAt: q.dueDate ? zonedTimeToUtc(q.dueDate, q.dueTime, timezone).toISOString() : null,
  });
  await track(supabase, userId, "task_created", { task_id: task.id, source: "quick_capture" });

  refresh();
  return { ok: true, taskId: task.id };
}

export async function deleteTaskAction(taskId: string) {
  await withSession(undefined, async ({ supabase }) => {
    await taskRepo.deleteTask(supabase, taskId);
    refresh();
  });
}

/** "Delete" from the UI is a soft delete: the task is cancelled, and Undo brings it straight back. */
export async function cancelTaskAction(taskId: string) {
  await withSession(undefined, async ({ supabase }) => {
    await taskRepo.setTaskStatus(supabase, taskId, "cancelled", null);
    refresh();
  });
}

export async function restoreTaskAction(taskId: string) {
  await withSession(undefined, async ({ supabase }) => {
    await taskRepo.setTaskStatus(supabase, taskId, "pending", null);
    refresh();
  });
}

export async function completeTaskAction(taskId: string): Promise<CompletionOutcome> {
  return withSession(EMPTY_OUTCOME, async ({ supabase, userId, timezone, profile }) => {
    const outcome = await completeTaskWithRewards(
      { supabase, userId, timezone, mode: profile.gamificationMode },
      taskId,
    );
    refresh();
    return outcome;
  });
}

export async function undoCompleteTaskAction(taskId: string) {
  await withSession(undefined, async ({ supabase }) => {
    await taskService.undoCompleteTask(supabase, taskId);
    refresh();
  });
}

export async function snoozeTaskAction(taskId: string, minutes: number) {
  await withSession(undefined, async ({ supabase, userId }) => {
    await taskService.snoozeTask(supabase, taskId, minutes);
    await track(supabase, userId, "task_rescheduled", { task_id: taskId, target: `snooze_${minutes}m` });
    refresh();
  });
}

export async function rescheduleTaskAction(taskId: string, target: RescheduleTarget) {
  await withSession(undefined, async ({ supabase, userId, timezone }) => {
    const date = taskService.resolveRescheduleDate(target, undefined, timezone);
    await taskService.moveTask(supabase, taskId, date);
    await track(supabase, userId, "task_rescheduled", { task_id: taskId, target });
    refresh();
  });
}

export async function addSubtaskAction(taskId: string, title: string, position: number) {
  const parsed = subtaskTitleSchema.safeParse(title);
  if (!parsed.success) return;
  await withSession(undefined, async ({ supabase, userId }) => {
    await taskRepo.createSubtask(supabase, userId, taskId, parsed.data, position);
    refresh();
  });
}

/** Saves a previewed breakdown as ordered subtasks, after whatever steps already exist. */
export async function applyBreakdownAction(taskId: string, steps: string[]): Promise<{ ok: boolean; error?: string }> {
  const parsed = breakdownStepsSchema.safeParse(steps);
  if (!parsed.success) return { ok: false, error: "Add at least one step." };

  return withSession({ ok: false, error: SIGN_IN_AGAIN }, async ({ supabase, userId }) => {
    const existing = await taskRepo.listSubtasks(supabase, taskId);
    if (existing.length + parsed.data.length > 7) {
      return { ok: false, error: "That would be more than 7 steps. Trim a few." };
    }
    for (const [i, title] of parsed.data.entries()) {
      await taskRepo.createSubtask(supabase, userId, taskId, title, existing.length + i);
    }
    refresh();
    return { ok: true };
  });
}

/**
 * Toggles a step. For a Boss Task, taking the last bite of HP defeats it —
 * the boss completes itself and the full celebration comes back.
 */
export async function toggleSubtaskAction(subtaskId: string, completed: boolean): Promise<CompletionOutcome> {
  return withSession(EMPTY_OUTCOME, async ({ supabase, userId, timezone, profile }) => {
    const subtask = await taskRepo.setSubtaskCompleted(supabase, subtaskId, completed);
    let outcome = EMPTY_OUTCOME;

    if (completed) {
      const task = await taskRepo.getTask(supabase, subtask.taskId);
      if (task?.isBoss && task.status === "pending") {
        const phases = await taskRepo.listSubtasks(supabase, task.id);
        if (bossStatus(phases).defeated) {
          outcome = await completeTaskWithRewards(
            { supabase, userId, timezone, mode: profile.gamificationMode },
            task.id,
          );
        }
      }
    }

    refresh();
    return outcome;
  });
}

export async function deleteSubtaskAction(subtaskId: string) {
  await withSession(undefined, async ({ supabase }) => {
    await taskRepo.deleteSubtask(supabase, subtaskId);
    refresh();
  });
}
