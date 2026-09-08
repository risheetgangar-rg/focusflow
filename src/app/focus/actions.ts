"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import * as taskService from "@/services/task-service";
import * as focusService from "@/services/focus-service";
import * as gamificationService from "@/services/gamification-service";
import { incrementDailyQuestIfEligible } from "@/services/quest-service";
import type { RewardResult } from "@/services/gamification-service";

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
  await gamificationService.awardXp(
    supabase,
    userId,
    "task_started",
    taskId,
    gamificationService.XP_AMOUNTS.TASK_STARTED,
  );
  return session.id;
}

export async function endFocusSessionAction(
  sessionId: string,
  completed: boolean,
): Promise<RewardResult | null> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return null;

  const { actualMinutes } = await focusService.endFocusSession(supabase, sessionId, completed);
  if (!completed) return null;

  return gamificationService.awardXp(
    supabase,
    userId,
    "focus_completed",
    sessionId,
    gamificationService.XP_AMOUNTS.FOCUS_SESSION,
    new Date(),
    { focusMinutes: actualMinutes },
  );
}

export async function completeSubtaskStepAction(subtaskId: string) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await taskRepo.setSubtaskCompleted(supabase, subtaskId, true);
  revalidatePath("/tasks");
}

export async function completeTaskStepAction(taskId: string): Promise<RewardResult | null> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return null;

  const task = await taskRepo.getTask(supabase, taskId);
  const completed = await taskService.completeTask(supabase, userId, taskId);
  revalidatePath("/tasks");
  revalidatePath("/today");

  if (!task) return null;
  const xp = gamificationService.xpForTaskCompletion(task);
  const reward = await gamificationService.awardXp(supabase, userId, "task_completed", taskId, xp);
  await incrementDailyQuestIfEligible(supabase, userId, completed);
  return reward;
}
