"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { combineDateAndTime } from "@/lib/dates/combine";
import { taskFormSchema } from "@/lib/validation/task";
import { subtaskTitleSchema } from "@/lib/validation/task";
import * as taskRepo from "@/repositories/task-repository";
import * as taskService from "@/services/task-service";
import type { RescheduleTarget } from "@/services/task-service";
import type { TaskPriority, RecurrenceRule } from "@/types/task";

export interface TaskFormState {
  error?: string;
  message?: string;
}

const NOT_CONFIGURED = "Supabase isn't connected yet — this is a local demo.";

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, userId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

function refresh() {
  revalidatePath("/tasks");
  revalidatePath("/today");
}

export async function saveTask(
  taskId: string | null,
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const parsed = taskFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { error: NOT_CONFIGURED };

  const values = parsed.data;
  const input = {
    title: values.title,
    description: values.description || null,
    priority: values.priority as TaskPriority,
    importance: values.importance,
    urgency: values.urgency,
    friction: values.friction,
    estimatedMinutes: values.estimatedMinutes === "" ? null : Number(values.estimatedMinutes),
    dueAt: values.dueDate ? combineDateAndTime(values.dueDate, values.dueTime) : null,
    scheduledAt: values.scheduledDate
      ? combineDateAndTime(values.scheduledDate, values.scheduledTime)
      : null,
    recurrenceRule: values.recurrenceRule === "none" ? null : (values.recurrenceRule as RecurrenceRule),
  };

  if (taskId) {
    await taskRepo.updateTask(supabase, taskId, input);
  } else {
    await taskRepo.createTask(supabase, userId, input);
  }

  refresh();
  return { message: "Saved." };
}

export async function deleteTaskAction(taskId: string) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await taskRepo.deleteTask(supabase, taskId);
  refresh();
}

export async function completeTaskAction(taskId: string) {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return;
  await taskService.completeTask(supabase, userId, taskId);
  refresh();
}

export async function undoCompleteTaskAction(taskId: string) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await taskService.undoCompleteTask(supabase, taskId);
  refresh();
}

export async function markTaskStartedAction(taskId: string) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await taskRepo.markTaskStarted(supabase, taskId);
  refresh();
}

export async function snoozeTaskAction(taskId: string, minutes: number) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await taskService.snoozeTask(supabase, taskId, minutes);
  refresh();
}

export async function rescheduleTaskAction(taskId: string, target: RescheduleTarget) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  const date = taskService.resolveRescheduleDate(target);
  await taskRepo.rescheduleTask(supabase, taskId, date.toISOString());
  refresh();
}

export async function addSubtaskAction(taskId: string, title: string, position: number) {
  const parsed = subtaskTitleSchema.safeParse(title);
  if (!parsed.success) return;
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return;
  await taskRepo.createSubtask(supabase, userId, taskId, parsed.data, position);
  refresh();
}

export async function toggleSubtaskAction(subtaskId: string, completed: boolean) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await taskRepo.setSubtaskCompleted(supabase, subtaskId, completed);
  refresh();
}

export async function deleteSubtaskAction(subtaskId: string) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await taskRepo.deleteSubtask(supabase, subtaskId);
  refresh();
}
