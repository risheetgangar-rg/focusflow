import { scoreTask, type RecommendationContext } from "@/services/recommendation-service";
import type { Task } from "@/types/task";

/**
 * Up to `limit` other things to start, quickest first. A task with no estimate
 * can't be called quick, so it goes after the ones that have one; ties go to
 * whichever the recommendation score likes better.
 */
export function pickAlternatives(
  tasks: Task[],
  excludeId: string,
  context: RecommendationContext,
  limit = 4,
): Task[] {
  const minutes = (task: Task) => task.estimatedMinutes ?? Number.POSITIVE_INFINITY;

  return tasks
    .filter((task) => task.status === "pending" && task.id !== excludeId)
    .map((task) => ({ task, score: scoreTask(task, context) }))
    .sort((a, b) => {
      const [ma, mb] = [minutes(a.task), minutes(b.task)];
      if (ma !== mb) return ma < mb ? -1 : 1;
      return b.score - a.score;
    })
    .slice(0, limit)
    .map(({ task }) => task);
}

const GENTLE_REASONS: Record<string, string> = {
  "From earlier": "Ready to pick back up",
  "Keeps getting pushed back": "Been waiting a while",
};

/** The recommendation's reason, worded so it never sounds like a telling-off. */
export function gentleReason(reason: string): string {
  return GENTLE_REASONS[reason] ?? reason;
}
