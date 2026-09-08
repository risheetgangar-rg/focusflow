"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import * as taskService from "@/services/task-service";
import * as focusService from "@/services/focus-service";

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, userId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function startFocusSessionAction(taskId: string, plannedMinutes: number | null) {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return null;
  await taskRepo.markTaskStarted(supabase, taskId);
  const session = await focusService.startFocusSession(supabase, userId, taskId, plannedMinutes);
  return session.id;
}

export async function endFocusSessionAction(sessionId: string, completed: boolean) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await focusService.endFocusSession(supabase, sessionId, completed);
}

export async function completeSubtaskStepAction(subtaskId: string) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await taskRepo.setSubtaskCompleted(supabase, subtaskId, true);
  revalidatePath("/tasks");
}

export async function completeTaskStepAction(taskId: string) {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return;
  await taskService.completeTask(supabase, userId, taskId);
  revalidatePath("/tasks");
  revalidatePath("/today");
}
