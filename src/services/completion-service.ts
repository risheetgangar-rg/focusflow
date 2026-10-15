import type { SupabaseClient } from "@supabase/supabase-js";
import { XP_AMOUNTS, xpForTaskCompletion } from "@/lib/gamification/rules";
import { todayDateString } from "@/services/habit-service";
import { pickOneMore } from "@/lib/tasks/one-more";
import * as taskRepo from "@/repositories/task-repository";
import { track } from "@/services/analytics-service";
import { awardXp, mergeRewards } from "@/services/gamification-service";
import { incrementDailyQuestIfEligible } from "@/services/quest-service";
import * as taskService from "@/services/task-service";
import type { CompletionOutcome } from "@/types/gamification";
import type { GamificationMode } from "@/types/user";

export interface CompletionContext {
  supabase: SupabaseClient;
  userId: string;
  timezone: string;
  mode: GamificationMode;
}

export const EMPTY_OUTCOME: CompletionOutcome = {
  reward: null,
  oneMore: null,
  bossDefeated: null,
  questCompleted: null,
};

/**
 * Completes a task and everything that follows from it — XP, momentum,
 * daily-quest progress, boss defeat, and the optional "one more?" offer —
 * in one place so every entry point (checkbox, focus mode, boss phases)
 * rewards identically. Safe to call twice: XP is idempotent per task.
 */
export async function completeTaskWithRewards(
  ctx: CompletionContext,
  taskId: string,
): Promise<CompletionOutcome> {
  const { supabase, userId, timezone, mode } = ctx;

  const task = await taskRepo.getTask(supabase, taskId);
  if (!task || task.status === "completed") return EMPTY_OUTCOME;

  const completed = await taskService.completeTask(supabase, userId, taskId);
  // Awaited together before returning: un-awaited work can be cut off once a serverless response is sent.
  const events: Promise<void>[] = [track(supabase, userId, "task_completed", { task_id: taskId, boss: task.isBoss })];

  // "off" means no game layer at all: the task still completes, nothing is awarded or shown.
  if (mode === "off") {
    await Promise.allSettled(events);
    return EMPTY_OUTCOME;
  }

  const achievements = mode === "full";
  let reward = await awardXp(supabase, userId, {
    type: "task_completed",
    sourceId: taskId,
    xp: xpForTaskCompletion(task),
    timezone,
    achievements,
  });

  let bossDefeated: string | null = null;
  if (task.isBoss && achievements) {
    const bossReward = await awardXp(supabase, userId, {
      type: "boss_defeated",
      sourceId: taskId,
      xp: XP_AMOUNTS.BOSS_DEFEATED,
      timezone,
      achievements,
    });
    if (bossReward) bossDefeated = task.title;
    reward = mergeRewards(reward, bossReward);
  }

  const questCompleted = achievements
    ? await incrementDailyQuestIfEligible(supabase, userId, completed, todayDateString(new Date(), timezone))
    : null;
  if (questCompleted) events.push(track(supabase, userId, "quest_completed", { title: questCompleted }));

  if (reward) {
    events.push(track(supabase, userId, "xp_awarded", { xp: reward.xpAwarded, source: "task_completed" }));
    if (reward.leveledUp) events.push(track(supabase, userId, "level_up", { level: reward.newLevel }));
  }

  const oneMore = reward ? pickOneMore(await taskRepo.listTasks(supabase, userId), { excludeTaskId: taskId }) : null;

  await Promise.allSettled(events);
  return { reward, oneMore, bossDefeated, questCompleted };
}
