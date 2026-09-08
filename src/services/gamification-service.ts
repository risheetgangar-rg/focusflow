import type { SupabaseClient } from "@supabase/supabase-js";
import * as gamificationRepo from "@/repositories/gamification-repository";
import type { XpEventType } from "@/types/gamification";
import type { Task } from "@/types/task";

export const XP_AMOUNTS = {
  TASK_STARTED: 5,
  TASK_COMPLETED_SMALL: 10,
  TASK_COMPLETED_IMPORTANT: 25,
  TASK_COMPLETED_DIFFICULT: 35,
  HABIT_COMPLETED: 10,
  FOCUS_SESSION: 15,
  DAILY_QUEST: 40,
  SIDE_QUEST: 5,
  RESCUE_ACTION: 20,
  COMEBACK: 25,
} as const;

/** Incorporates friction and importance, per spec §40 — starting a hard task should feel worth it. */
export function xpForTaskCompletion(task: Pick<Task, "friction" | "importance">): number {
  if (task.friction >= 4) return XP_AMOUNTS.TASK_COMPLETED_DIFFICULT;
  if (task.importance >= 4) return XP_AMOUNTS.TASK_COMPLETED_IMPORTANT;
  return XP_AMOUNTS.TASK_COMPLETED_SMALL;
}

const LEVEL_TITLES = [
  "Starting Point",
  "Getting Moving",
  "Building Momentum",
  "Finding Rhythm",
  "In The Zone",
];

/** Cumulative XP required to reach `level` (level 1 = 0). Level N costs 100*N more than N-1. */
export function cumulativeXpForLevel(level: number): number {
  return (100 * (level - 1) * level) / 2;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] ?? `Level ${level}`;
}

export interface LevelProgress {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const base = cumulativeXpForLevel(level);
  const next = cumulativeXpForLevel(level + 1);
  return { level, title: levelTitle(level), xpIntoLevel: xp - base, xpForNextLevel: next - base };
}

const MOMENTUM_RESET_MINUTES = 180;

/** Momentum is session-based — a long enough gap since the last activity starts a fresh session. */
export function nextMomentum(currentMomentum: number, lastActivityAt: string | null, now: Date): number {
  if (!lastActivityAt) return 1;
  const minutesSince = (now.getTime() - new Date(lastActivityAt).getTime()) / 60_000;
  if (minutesSince > MOMENTUM_RESET_MINUTES) return 1;
  return currentMomentum + 1;
}

const COMEBACK_THRESHOLD_HOURS = 48;

export function isComeback(lastActivityAt: string | null, now: Date): boolean {
  if (!lastActivityAt) return false;
  const hoursSince = (now.getTime() - new Date(lastActivityAt).getTime()) / 3_600_000;
  return hoursSince >= COMEBACK_THRESHOLD_HOURS;
}

export const SIDE_QUEST_POOL = [
  "Drink water",
  "Clear your desk",
  "Reply to one email",
  "Put laundry away",
  "Stand up and stretch",
];

/** Picks a stable side quest for the day so it doesn't change on every reload. */
export function pickSideQuest(dateSeed: string): string {
  let hash = 0;
  for (let i = 0; i < dateSeed.length; i++) hash = (hash * 31 + dateSeed.charCodeAt(i)) >>> 0;
  return SIDE_QUEST_POOL[hash % SIDE_QUEST_POOL.length];
}

export interface RewardResult {
  xpAwarded: number;
  totalXp: number;
  leveledUp: boolean;
  newLevel: number;
  momentum: number;
  isComeback: boolean;
  unlockedAchievements: string[];
}

/**
 * Single entry point for awarding XP after any completion. Idempotent per
 * (userId, eventType, sourceId) via the xp_events unique constraint, so a
 * retried request or double-click never double-awards. Also rolls up
 * momentum, level-ups, comeback bonus, and achievement unlocks so callers
 * (server actions) don't have to orchestrate five separate writes.
 */
export async function awardXp(
  supabase: SupabaseClient,
  userId: string,
  eventType: XpEventType,
  sourceId: string | null,
  xpAmount: number,
  now: Date = new Date(),
  context: { focusMinutes?: number } = {},
): Promise<RewardResult | null> {
  const stateBefore = await gamificationRepo.getState(supabase, userId);
  const recorded = await gamificationRepo.recordXpEvent(supabase, userId, eventType, sourceId, xpAmount);
  if (!recorded) return null;

  const comeback = isComeback(stateBefore.lastActivityAt, now);
  const momentum = nextMomentum(stateBefore.currentMomentum, stateBefore.lastActivityAt, now);
  let totalXp = stateBefore.xp + xpAmount;

  const unlocked: string[] = [];
  let xpAwarded = xpAmount;

  if (comeback) {
    const comebackAwarded = await gamificationRepo.recordXpEvent(
      supabase,
      userId,
      "comeback",
      now.toISOString().slice(0, 10),
      XP_AMOUNTS.COMEBACK,
    );
    if (comebackAwarded) {
      totalXp += XP_AMOUNTS.COMEBACK;
      xpAwarded += XP_AMOUNTS.COMEBACK;
      const r = await gamificationRepo.unlockAchievement(supabase, userId, "COMEBACK");
      if (r?.unlocked) unlocked.push(r.name);
    }
  }

  const newLevel = levelForXp(totalXp);
  const longestMomentum = Math.max(momentum, stateBefore.longestMomentum);
  await gamificationRepo.updateMomentumAndLevel(supabase, userId, momentum, longestMomentum, newLevel);

  if (eventType === "task_completed") {
    const completedCount = await gamificationRepo.countXpEventsByType(supabase, userId, "task_completed");
    if (completedCount === 1) {
      const r = await gamificationRepo.unlockAchievement(supabase, userId, "FIRST_STEP");
      if (r?.unlocked) unlocked.push(r.name);
    }
    if (completedCount >= 5) {
      const r = await gamificationRepo.unlockAchievement(supabase, userId, "TINY_WINS");
      if (r?.unlocked) unlocked.push(r.name);
    }
  }

  if (momentum >= 3) {
    const r = await gamificationRepo.unlockAchievement(supabase, userId, "MOMENTUM");
    if (r?.unlocked) unlocked.push(r.name);
  }

  if (eventType === "focus_completed" && (context.focusMinutes ?? 0) >= 25) {
    const r = await gamificationRepo.unlockAchievement(supabase, userId, "DEEP_FOCUS");
    if (r?.unlocked) unlocked.push(r.name);
  }

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
