import type { SupabaseClient } from "@supabase/supabase-js";
import { zonedDateString } from "@/lib/dates/tz";
import {
  XP_AMOUNTS,
  isComeback,
  levelForXp,
  nextMomentum,
} from "@/lib/gamification/rules";
import * as gamificationRepo from "@/repositories/gamification-repository";
import type { RewardResult, XpEventType } from "@/types/gamification";

export interface AwardOptions {
  type: XpEventType;
  /** What the XP is for (task id, session id...). Together with `type` this makes the award idempotent. */
  sourceId: string | null;
  xp: number;
  now?: Date;
  /** The person's timezone, so "once per day" bonuses follow their calendar day, not UTC's. */
  timezone?: string;
  focusMinutes?: number;
  /** Achievements are part of the full game layer only. */
  achievements?: boolean;
}

/**
 * Single entry point for awarding XP after any completion. Idempotent per
 * (userId, type, sourceId) via the xp_events unique constraint, so a retried
 * request or double-click never double-pays. Also rolls up momentum,
 * level-ups, the comeback bonus, and achievement unlocks so callers don't have
 * to orchestrate half a dozen separate writes.
 */
export async function awardXp(
  supabase: SupabaseClient,
  userId: string,
  options: AwardOptions,
): Promise<RewardResult | null> {
  const { type, sourceId, xp, now = new Date(), timezone = "UTC", focusMinutes = 0, achievements = false } = options;

  const stateBefore = await gamificationRepo.getState(supabase, userId);
  const recorded = await gamificationRepo.recordXpEvent(supabase, userId, type, sourceId, xp);
  if (!recorded) return null;

  const comeback = isComeback(stateBefore.lastActivityAt, now);
  const momentum = nextMomentum(stateBefore.currentMomentum, stateBefore.lastActivityAt, now);
  let totalXp = stateBefore.xp + xp;
  let xpAwarded = xp;
  const unlocked: string[] = [];

  const unlock = async (code: string) => {
    if (!achievements) return;
    const result = await gamificationRepo.unlockAchievement(supabase, userId, code);
    if (result?.unlocked) {
      unlocked.push(result.name);
      totalXp += result.xpReward;
      xpAwarded += result.xpReward;
    }
  };

  if (comeback) {
    const bonusGranted = await gamificationRepo.recordXpEvent(
      supabase,
      userId,
      "comeback",
      zonedDateString(now, timezone),
      XP_AMOUNTS.COMEBACK,
    );
    if (bonusGranted) {
      totalXp += XP_AMOUNTS.COMEBACK;
      xpAwarded += XP_AMOUNTS.COMEBACK;
    }
  }

  // "Return after time away and complete something": a recent comeback bonus + a completion.
  if (type === "task_completed" && (comeback || (await gamificationRepo.hasRecentEvent(supabase, userId, "comeback", 24)))) {
    await unlock("COMEBACK");
  }

  if (type === "task_completed") {
    const completedCount = await gamificationRepo.countXpEventsByType(supabase, userId, "task_completed");
    if (completedCount === 1) await unlock("FIRST_STEP");
    if (completedCount >= 5) await unlock("TINY_WINS");
  }
  if (momentum >= 3) await unlock("MOMENTUM");
  if (type === "focus_completed" && focusMinutes >= 25) await unlock("DEEP_FOCUS");
  if (type === "boss_defeated") await unlock("BOSS_SLAYER");

  const newLevel = levelForXp(totalXp);
  const longestMomentum = Math.max(momentum, stateBefore.longestMomentum);
  await gamificationRepo.updateMomentumAndLevel(supabase, userId, momentum, longestMomentum, newLevel);

  return {
    xpAwarded,
    totalXp,
    leveledUp: newLevel > stateBefore.level,
    newLevel,
    momentum,
    isComeback: comeback,
    unlockedAchievements: unlocked,
  };
}

/** Combine two rewards from one user action into a single celebration. */
export function mergeRewards(first: RewardResult | null, second: RewardResult | null): RewardResult | null {
  if (!first) return second;
  if (!second) return first;
  return {
    xpAwarded: first.xpAwarded + second.xpAwarded,
    totalXp: second.totalXp,
    leveledUp: first.leveledUp || second.leveledUp,
    newLevel: second.newLevel,
    momentum: second.momentum,
    isComeback: first.isComeback || second.isComeback,
    unlockedAchievements: [...first.unlockedAchievements, ...second.unlockedAchievements],
  };
}

/** Grants the "welcome back" bonus on return itself, once per day. */
export async function claimComeback(
  supabase: SupabaseClient,
  userId: string,
  dateKey: string,
  now: Date = new Date(),
): Promise<number> {
  const state = await gamificationRepo.getState(supabase, userId);
  if (!isComeback(state.lastActivityAt, now)) return 0;
  const granted = await gamificationRepo.recordXpEvent(
    supabase,
    userId,
    "comeback",
    dateKey,
    XP_AMOUNTS.COMEBACK,
  );
  return granted ? XP_AMOUNTS.COMEBACK : 0;
}
