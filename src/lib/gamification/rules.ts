/**
 * Pure game rules: no I/O, safe to import from client and server code alike.
 * The DB-touching orchestration lives in services/gamification-service.ts.
 */
import type { GamificationMode } from "@/types/user";
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
  BOSS_DEFEATED: 100,
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
  "Steady Flow",
  "Deep Focus",
  "Flow State",
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
  return LEVEL_TITLES[level - 1] ?? `Level ${level}`;
}

export interface LevelProgress {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  fraction: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const base = cumulativeXpForLevel(level);
  const next = cumulativeXpForLevel(level + 1);
  const xpIntoLevel = xp - base;
  const xpForNextLevel = next - base;
  return {
    level,
    title: levelTitle(level),
    xpIntoLevel,
    xpForNextLevel,
    fraction: xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1,
  };
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

/* ---------- Companion ---------- */

export type CompanionStage = 1 | 2 | 3;

export function companionStage(level: number): CompanionStage {
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  return 1;
}

export const COMPANION_STAGE_NAMES: Record<CompanionStage, string> = {
  1: "Spark",
  2: "Glow",
  3: "Star",
};

/* ---------- Cosmetic themes ---------- */

export type ThemeId = "paper" | "midnight" | "sage" | "dusk" | "sunrise";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  blurb: string;
  unlockLevel: number;
  /** [page background, ink, accent] — used only to draw the preview swatch. */
  swatch: [string, string, string];
}

export const THEMES: ThemeDefinition[] = [
  { id: "paper", name: "Paper", blurb: "Warm, quiet, easy on the eyes.", unlockLevel: 1, swatch: ["#faf9f6", "#161614", "#5b4bf0"] },
  { id: "midnight", name: "Midnight", blurb: "Low light, low glare.", unlockLevel: 1, swatch: ["#111113", "#f4f2ee", "#8f86ff"] },
  { id: "sage", name: "Sage", blurb: "Soft greens for a calm head.", unlockLevel: 2, swatch: ["#f3f6f0", "#1a2a20", "#3f7d58"] },
  { id: "dusk", name: "Dusk", blurb: "Lavender evenings.", unlockLevel: 3, swatch: ["#f6f3fb", "#231a33", "#7c3aed"] },
  { id: "sunrise", name: "Sunrise", blurb: "Peach and morning light.", unlockLevel: 4, swatch: ["#fdf5ee", "#2b1b12", "#e8590c"] },
];

export const DEFAULT_THEME: ThemeId = "paper";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

/** Locks only exist when the full game layer is on; otherwise every theme is open. */
export function isThemeUnlocked(theme: ThemeDefinition, level: number, mode: GamificationMode): boolean {
  if (mode !== "full") return true;
  return level >= theme.unlockLevel;
}
