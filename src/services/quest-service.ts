import type { SupabaseClient } from "@supabase/supabase-js";
import * as gamificationRepo from "@/repositories/gamification-repository";
import { pickSideQuest, XP_AMOUNTS } from "@/services/gamification-service";
import { todayDateString } from "@/services/habit-service";
import type { Task } from "@/types/task";

const DAILY_QUEST_TARGET = 3;

export async function ensureDailyQuest(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string = todayDateString(),
): Promise<void> {
  await gamificationRepo.ensureQuestExists(supabase, userId, {
    type: "daily",
    title: `Complete ${DAILY_QUEST_TARGET} important tasks`,
    description: "Any task marked important or urgent counts.",
    target: DAILY_QUEST_TARGET,
    xpReward: XP_AMOUNTS.DAILY_QUEST,
    date: dateStr,
  });
}

export async function ensureSideQuest(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string = todayDateString(),
): Promise<void> {
  await gamificationRepo.ensureQuestExists(supabase, userId, {
    type: "side",
    title: pickSideQuest(dateStr),
    target: 1,
    xpReward: XP_AMOUNTS.SIDE_QUEST,
    date: dateStr,
  });
}

async function completeQuestReward(supabase: SupabaseClient, userId: string, questId: string, xpReward: number) {
  await gamificationRepo.recordXpEvent(supabase, userId, "daily_quest_completed", questId, xpReward);
}

/** Only tasks marked important or urgent count toward the daily quest — small/easy wins don't inflate it. */
export async function incrementDailyQuestIfEligible(
  supabase: SupabaseClient,
  userId: string,
  task: Pick<Task, "importance" | "urgency">,
): Promise<void> {
  if (task.importance < 4 && task.urgency < 4) return;

  const dateStr = todayDateString();
  const quests = await gamificationRepo.listQuestsForDate(supabase, userId, dateStr);
  const daily = quests.find((q) => q.type === "daily" && !q.completed);
  if (!daily) return;

  const updated = await gamificationRepo.incrementQuestProgress(supabase, daily.id);
  if (updated.completed) {
    await completeQuestReward(supabase, userId, updated.id, updated.xpReward);
  }
}

export async function completeSideQuestAction(
  supabase: SupabaseClient,
  userId: string,
  questId: string,
): Promise<void> {
  const updated = await gamificationRepo.incrementQuestProgress(supabase, questId);
  if (updated.completed) {
    await completeQuestReward(supabase, userId, updated.id, updated.xpReward);
  }
}
