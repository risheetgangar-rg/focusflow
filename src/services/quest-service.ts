import type { SupabaseClient } from "@supabase/supabase-js";
import { XP_AMOUNTS, pickSideQuest } from "@/lib/gamification/rules";
import * as gamificationRepo from "@/repositories/gamification-repository";
import type { Task } from "@/types/task";

const DAILY_QUEST_TARGET = 3;

export async function ensureDailyQuest(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string,
): Promise<void> {
  await gamificationRepo.ensureQuestExists(supabase, userId, {
    type: "daily",
    title: `Complete ${DAILY_QUEST_TARGET} important tasks`,
    description: "Anything marked important or urgent counts.",
    target: DAILY_QUEST_TARGET,
    xpReward: XP_AMOUNTS.DAILY_QUEST,
    date: dateStr,
  });
}

export async function ensureSideQuest(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string,
): Promise<void> {
  await gamificationRepo.ensureQuestExists(supabase, userId, {
    type: "side",
    title: pickSideQuest(dateStr),
    target: 1,
    xpReward: XP_AMOUNTS.SIDE_QUEST,
    date: dateStr,
  });
}

/**
 * Only tasks marked important or urgent count toward the daily quest —
 * small/easy wins don't inflate it. Returns the quest's title if this
 * completion just finished it.
 */
export async function incrementDailyQuestIfEligible(
  supabase: SupabaseClient,
  userId: string,
  task: Pick<Task, "importance" | "urgency">,
  dateStr: string,
): Promise<string | null> {
  if (task.importance < 4 && task.urgency < 4) return null;

  const quests = await gamificationRepo.listQuestsForDate(supabase, userId, dateStr);
  const daily = quests.find((q) => q.type === "daily" && !q.completed);
  if (!daily) return null;

  const updated = await gamificationRepo.incrementQuestProgress(supabase, daily.id);
  if (!updated.completed) return null;

  await gamificationRepo.recordXpEvent(supabase, userId, "daily_quest_completed", updated.id, updated.xpReward);
  return updated.title;
}

export async function completeSideQuest(
  supabase: SupabaseClient,
  userId: string,
  questId: string,
): Promise<number> {
  const updated = await gamificationRepo.incrementQuestProgress(supabase, questId);
  if (!updated.completed) return 0;
  const granted = await gamificationRepo.recordXpEvent(
    supabase,
    userId,
    "side_quest_completed",
    updated.id,
    updated.xpReward,
  );
  return granted ? updated.xpReward : 0;
}
