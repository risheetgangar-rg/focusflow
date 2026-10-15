import type { CompletionOutcome, RewardResult } from "@/types/gamification";
import type { Subtask } from "@/types/task";

/** One thing to do. A task without steps counts as a single step: the task itself. */
export interface FocusStep {
  /** Stable identity: the subtask id, or TASK_STEP_KEY for the task itself. */
  key: string;
  /** The subtask to tick off, or null when the step is the whole task. */
  id: string | null;
  title: string;
  completed: boolean;
}

export const TASK_STEP_KEY = "task";
/** What "Continue" adds when a countdown runs out. */
export const EXTEND_MINUTES = 5;
export const MAX_TIMER_MINUTES = 180;

export interface FocusPlan {
  /** Every step in order, for the progress dots. Empty when the task has no steps of its own. */
  steps: FocusStep[];
  /** What is left to do, in the order to do it. Never empty. */
  queue: FocusStep[];
  /** Every step is ticked off but the task itself is still open. */
  wrapUp: boolean;
}

/**
 * Works out what's left to do. `done` are steps finished during this visit
 * (they count immediately, before the server catches up); `skipped` are steps
 * moved to the back of the line, in the order they were skipped.
 */
export function planFocus(
  taskTitle: string,
  subtasks: readonly Subtask[],
  done: ReadonlySet<string>,
  skipped: readonly string[],
): FocusPlan {
  const taskStep: FocusStep = { key: TASK_STEP_KEY, id: null, title: taskTitle, completed: false };
  if (subtasks.length === 0) return { steps: [], queue: [taskStep], wrapUp: false };

  const steps: FocusStep[] = subtasks.map((s) => ({
    key: s.id,
    id: s.id,
    title: s.title,
    completed: s.completed || done.has(s.id),
  }));
  const open = steps.filter((s) => !s.completed);
  if (open.length === 0) return { steps, queue: [taskStep], wrapUp: true };

  const later = skipped.flatMap((key) => open.filter((s) => s.key === key));
  const laterKeys = new Set(later.map((s) => s.key));
  return { steps, queue: [...open.filter((s) => !laterKeys.has(s.key)), ...later], wrapUp: false };
}

/** The small line above the step: where you are, without any pressure. */
export function focusEyebrow(plan: FocusPlan, currentKey: string): string {
  if (plan.wrapUp) return "All steps done";
  const index = plan.steps.findIndex((s) => s.key === currentKey);
  if (index === -1) return "Just this one";
  return `Step ${index + 1} of ${plan.steps.length}`;
}

/** The huge headline shrinks a little for long titles so it never overflows. */
export function headlineSize(title: string): string {
  if (title.length <= 36) return "text-5xl sm:text-7xl";
  if (title.length <= 80) return "text-4xl sm:text-6xl";
  return "text-3xl sm:text-5xl";
}

/* ---------- Timer ---------- */

export type TimerValue = "none" | "5" | "10" | "15" | "25" | "custom";

export interface TimerSelection {
  valid: boolean;
  /** null means "no timer". */
  minutes: number | null;
}

export function parseCustomMinutes(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  const minutes = Number(trimmed);
  return minutes >= 1 && minutes <= MAX_TIMER_MINUTES ? minutes : null;
}

export function resolveTimer(value: TimerValue, customText: string): TimerSelection {
  if (value === "none") return { valid: true, minutes: null };
  if (value === "custom") {
    const minutes = parseCustomMinutes(customText);
    return { valid: minutes !== null, minutes };
  }
  return { valid: true, minutes: Number(value) };
}

const two = (n: number) => String(n).padStart(2, "0");

/** 754 -> "12:34", 3725 -> "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${minutes}:${two(seconds)}`;
}

/** The same time, for screen readers: "12 minutes 34 seconds". */
export function spokenClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const parts: string[] = [];
  if (hours > 0) parts.push(unit(hours, "hour"));
  if (minutes > 0) parts.push(unit(minutes, "minute"));
  if (seconds > 0 || parts.length === 0) parts.push(unit(seconds, "second"));
  return parts.join(" ");
}

/* ---------- Rewards ---------- */

/** Adds two rewards into one, so finishing a task and a focus session celebrate once. */
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

/** The task's outcome, with the focus session's XP folded into its reward. */
export function mergeOutcomes(task: CompletionOutcome, focus: CompletionOutcome | null): CompletionOutcome {
  return { ...task, reward: mergeRewards(task.reward, focus?.reward ?? null) };
}
