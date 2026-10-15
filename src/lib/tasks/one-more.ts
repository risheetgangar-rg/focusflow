import type { Task } from "@/types/task";

export interface OneMoreSuggestion {
  taskId: string;
  title: string;
  minutes: number;
}

const DEFAULT_MAX_MINUTES = 5;

/**
 * "One more?" offers a genuinely tiny task right after a win, only when the
 * user has told us it's tiny (an estimate of a few minutes). It never guesses
 * — no estimate, no offer — and never offers a boss task.
 */
export function pickOneMore(
  tasks: Task[],
  options: { excludeTaskId?: string; maxMinutes?: number } = {},
): OneMoreSuggestion | null {
  const { excludeTaskId, maxMinutes = DEFAULT_MAX_MINUTES } = options;

  const candidates = tasks
    .filter(
      (t) =>
        t.status === "pending" &&
        t.id !== excludeTaskId &&
        !t.isBoss &&
        t.estimatedMinutes !== null &&
        t.estimatedMinutes <= maxMinutes,
    )
    .sort((a, b) => {
      const minutes = (a.estimatedMinutes ?? 0) - (b.estimatedMinutes ?? 0);
      return minutes !== 0 ? minutes : b.importance - a.importance;
    });

  const best = candidates[0];
  return best ? { taskId: best.id, title: best.title, minutes: best.estimatedMinutes ?? 0 } : null;
}

/** At most this many offers per day, and never twice within the cooldown. */
export const ONE_MORE_DAILY_LIMIT = 3;
export const ONE_MORE_COOLDOWN_MINUTES = 45;

export function canOfferOneMore(
  history: { count: number; lastOfferedAt: number | null },
  now: number = Date.now(),
): boolean {
  if (history.count >= ONE_MORE_DAILY_LIMIT) return false;
  if (history.lastOfferedAt === null) return true;
  return now - history.lastOfferedAt >= ONE_MORE_COOLDOWN_MINUTES * 60_000;
}
