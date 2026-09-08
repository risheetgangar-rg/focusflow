import type { SupabaseClient } from "@supabase/supabase-js";
import type { GamificationState, Quest, XpEventType } from "@/types/gamification";

export async function getState(
  supabase: SupabaseClient,
  userId: string,
): Promise<GamificationState> {
  const { data, error } = await supabase
    .from("user_gamification")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    return { xp: 0, level: 1, currentMomentum: 0, longestMomentum: 0, lastActivityAt: null };
  }
  return {
    xp: data.xp,
    level: data.level,
    currentMomentum: data.current_momentum,
    longestMomentum: data.longest_momentum,
    lastActivityAt: data.last_activity_at,
  };
}

/** Inserts into the immutable xp_events ledger. Returns false (no-op) if this exact (user, type, source) already exists. */
export async function recordXpEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: XpEventType | "achievement_unlocked",
  sourceId: string | null,
  xpAmount: number,
  metadata: Record<string, unknown> = {},
): Promise<boolean> {
  const { error } = await supabase.from("xp_events").insert({
    user_id: userId,
    event_type: eventType,
    source_id: sourceId,
    xp_amount: xpAmount,
    metadata,
  });
  if (error) {
    if (error.code === "23505") return false;
    throw error;
  }
  return true;
}

export async function updateMomentumAndLevel(
  supabase: SupabaseClient,
  userId: string,
  momentum: number,
  longestMomentum: number,
  level: number,
): Promise<void> {
  const { error } = await supabase
    .from("user_gamification")
    .upsert(
      { user_id: userId, current_momentum: momentum, longest_momentum: longestMomentum, level },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

export async function unlockAchievement(
  supabase: SupabaseClient,
  userId: string,
  code: string,
): Promise<{ unlocked: boolean; name: string; xpReward: number } | null> {
  const { data: achievement, error: fetchError } = await supabase
    .from("achievements")
    .select("id, name, xp_reward")
    .eq("code", code)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("user_achievements")
    .insert({ user_id: userId, achievement_id: achievement.id });
  if (error) {
    if (error.code === "23505") return { unlocked: false, name: achievement.name, xpReward: 0 };
    throw error;
  }

  await recordXpEvent(supabase, userId, "achievement_unlocked", code, achievement.xp_reward);
  return { unlocked: true, name: achievement.name, xpReward: achievement.xp_reward };
}

export async function countXpEventsByType(
  supabase: SupabaseClient,
  userId: string,
  eventType: XpEventType,
): Promise<number> {
  const { count, error } = await supabase
    .from("xp_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", eventType);
  if (error) throw error;
  return count ?? 0;
}

function toQuest(row: {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  target: number;
  progress: number;
  xp_reward: number;
  date: string;
  completed: boolean;
}): Quest {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as Quest["type"],
    title: row.title,
    description: row.description,
    target: row.target,
    progress: row.progress,
    xpReward: row.xp_reward,
    date: row.date,
    completed: row.completed,
  };
}

export async function listQuestsForDate(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<Quest[]> {
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("type", { ascending: true });
  if (error) throw error;
  return data.map(toQuest);
}

export async function ensureQuestExists(
  supabase: SupabaseClient,
  userId: string,
  quest: { type: Quest["type"]; title: string; description?: string; target: number; xpReward: number; date: string },
): Promise<void> {
  const { error } = await supabase.from("quests").insert({
    user_id: userId,
    type: quest.type,
    title: quest.title,
    description: quest.description ?? null,
    target: quest.target,
    xp_reward: quest.xpReward,
    date: quest.date,
  });
  if (error && error.code !== "23505") throw error;
}

export async function incrementQuestProgress(
  supabase: SupabaseClient,
  questId: string,
): Promise<Quest> {
  const { data: quest, error: fetchError } = await supabase
    .from("quests")
    .select("*")
    .eq("id", questId)
    .single();
  if (fetchError) throw fetchError;

  const progress = Math.min(quest.target, quest.progress + 1);
  const completed = progress >= quest.target;

  const { data, error } = await supabase
    .from("quests")
    .update({ progress, completed })
    .eq("id", questId)
    .select("*")
    .single();
  if (error) throw error;
  return toQuest(data);
}
