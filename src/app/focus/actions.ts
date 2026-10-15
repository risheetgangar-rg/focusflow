"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { XP_AMOUNTS } from "@/lib/gamification/rules";
import * as taskRepo from "@/repositories/task-repository";
import { track } from "@/services/analytics-service";
import { completeTaskWithRewards, EMPTY_OUTCOME } from "@/services/completion-service";
import * as focusService from "@/services/focus-service";
import { awardXp } from "@/services/gamification-service";
import type { CompletionOutcome } from "@/types/gamification";

export async function startFocusSessionAction(taskId: string, plannedMinutes: number | null): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  const { supabase, userId, timezone, profile } = session;

  await taskRepo.markTaskStarted(supabase, taskId);
  const focus = await focusService.startFocusSession(supabase, userId, taskId, plannedMinutes);
  await Promise.all([
    track(supabase, userId, "task_started", { task_id: taskId }),
    track(supabase, userId, "focus_started", { task_id: taskId, planned_minutes: plannedMinutes }),
    profile.gamificationMode === "off"
      ? Promise.resolve(null)
      : awardXp(supabase, userId, {
          type: "task_started",
          sourceId: taskId,
          xp: XP_AMOUNTS.TASK_STARTED,
          timezone,
          achievements: profile.gamificationMode === "full",
        }),
  ]);
  revalidatePath("/today");
  return focus.id;
}

export async function endFocusSessionAction(sessionId: string, completed: boolean): Promise<CompletionOutcome> {
  const session = await getSession();
  if (!session) return EMPTY_OUTCOME;
  const { supabase, userId, timezone, profile } = session;

  const { actualMinutes } = await focusService.endFocusSession(supabase, sessionId, completed);
  if (!completed) return EMPTY_OUTCOME;

  await track(supabase, userId, "focus_completed", { minutes: actualMinutes });
  if (profile.gamificationMode === "off") return EMPTY_OUTCOME;

  const reward = await awardXp(supabase, userId, {
    type: "focus_completed",
    sourceId: sessionId,
    xp: XP_AMOUNTS.FOCUS_SESSION,
    timezone,
    focusMinutes: actualMinutes,
    achievements: profile.gamificationMode === "full",
  });
  return { ...EMPTY_OUTCOME, reward };
}

export async function completeSubtaskStepAction(subtaskId: string) {
  const session = await getSession();
  if (!session) return;
  await taskRepo.setSubtaskCompleted(session.supabase, subtaskId, true);
  revalidatePath("/tasks");
}

/** Finishing the last step completes the task itself, with the full reward. */
export async function completeTaskStepAction(taskId: string): Promise<CompletionOutcome> {
  const session = await getSession();
  if (!session) return EMPTY_OUTCOME;
  const { supabase, userId, timezone, profile } = session;

  const outcome = await completeTaskWithRewards(
    { supabase, userId, timezone, mode: profile.gamificationMode },
    taskId,
  );
  revalidatePath("/tasks");
  revalidatePath("/today");
  return outcome;
}
