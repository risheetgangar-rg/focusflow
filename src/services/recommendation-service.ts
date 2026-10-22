import { isDueToday, isOverdue } from "@/lib/dates/overdue";
import type { Task } from "@/types/task";

export interface RecommendationContext {
  now: Date;
  /** Minutes the user says they have available right now, if known. */
  availableMinutes?: number;
  /** IANA timezone used for "due today" wording; defaults to UTC. */
  timezone?: string;
}

export interface Recommendation {
  task: Task;
  score: number;
  reason: string;
}

function deadlineProximityScore(dueAt: string, now: Date): number {
  const hoursUntil = (new Date(dueAt).getTime() - now.getTime()) / 3_600_000;
  if (hoursUntil <= 0) return 1;
  const horizonHours = 7 * 24;
  if (hoursUntil >= horizonHours) return 0;
  return 1 - hoursUntil / horizonHours;
}

function scheduledRelevanceScore(scheduledAt: string, now: Date): number {
  const diffHours = (new Date(scheduledAt).getTime() - now.getTime()) / 3_600_000;
  if (diffHours <= 0 && diffHours > -2) return 1;
  if (diffHours > 0 && diffHours <= 1) return 0.8;
  if (diffHours > 1 && diffHours <= 24) return 0.4;
  return 0;
}

/**
 * Deterministic priority score in roughly [0, 1.5]. Higher is more
 * actionable right now. Weights follow the product spec: urgency 0.30,
 * importance 0.25, deadline proximity 0.20, overdue 0.15, scheduled
 * relevance 0.10 — then adjusted for friction, duration fit, momentum,
 * and postponement fatigue.
 */
export function scoreTask(task: Task, context: RecommendationContext): number {
  const { now } = context;

  const urgencyScore = task.urgency / 5;
  const importanceScore = task.importance / 5;
  const deadlineScore = task.dueAt ? deadlineProximityScore(task.dueAt, now) : 0;
  const overdueScore = isOverdue(task.dueAt, task.status, now) ? 1 : 0;
  const scheduledScore = task.scheduledAt ? scheduledRelevanceScore(task.scheduledAt, now) : 0;

  let score =
    urgencyScore * 0.3 +
    importanceScore * 0.25 +
    deadlineScore * 0.2 +
    overdueScore * 0.15 +
    scheduledScore * 0.1;

  // High friction makes a task slightly less likely to surface on its own —
  // it needs activation help (flagged in the UI), not just a nudge.
  score -= (task.friction - 1) * 0.02;

  if (context.availableMinutes && task.estimatedMinutes) {
    score += task.estimatedMinutes <= context.availableMinutes ? 0.05 : -0.1;
  }

  // Don't abandon a task already in progress.
  if (task.startedAt) score += 0.15;

  // Gently surface tasks that keep getting pushed, capped so it can't dominate.
  score += Math.min(task.postponedCount, 3) * 0.03;

  return score;
}

function buildReason(task: Task, context: RecommendationContext): string {
  const { now } = context;

  if (isOverdue(task.dueAt, task.status, now)) return "From earlier";
  if (task.startedAt) return "Already in progress";
  if (task.scheduledAt) {
    const diffHours = (new Date(task.scheduledAt).getTime() - now.getTime()) / 3_600_000;
    if (diffHours <= 0 && diffHours > -2) return "Scheduled for now";
  }
  if (task.dueAt && isDueToday(task.dueAt, now, context.timezone)) return "Due today";
  if (task.urgency >= 4) return "Urgent";
  if (task.importance >= 4) return "Important";
  if (task.postponedCount >= 2) return "Keeps getting pushed back";
  return "Next up";
}

const WAITING_GRACE_MS = 10 * 60_000;

/**
 * Snoozed or planned for later: it has a start time that hasn't arrived yet.
 * "What's next" leaves these alone until their time is close, so snoozing a
 * task (or moving it to tomorrow) actually gets it out of the way.
 */
export function isWaiting(task: Pick<Task, "scheduledAt">, now: Date): boolean {
  return task.scheduledAt !== null && new Date(task.scheduledAt).getTime() - now.getTime() > WAITING_GRACE_MS;
}

/** The best few tasks to do right now, best first. recommendNext is simply the first of these. */
export function recommendTop(tasks: Task[], context: RecommendationContext, limit = 3): Recommendation[] {
  return tasks
    .filter((t) => t.status === "pending" && !isWaiting(t, context.now))
    .map((task) => ({ task, score: scoreTask(task, context) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ task, score }) => ({ task, score, reason: buildReason(task, context) }));
}

export function recommendNext(tasks: Task[], context: RecommendationContext): Recommendation | null {
  return recommendTop(tasks, context, 1)[0] ?? null;
}
