export interface AnalyticsEventLike {
  name: string;
  createdAt: string;
  properties?: Record<string, unknown> | null;
}

export interface UnstuckResult {
  /** Sessions that opened with at least one overdue task. */
  sessions: number;
  /** Of those, how many were followed by starting or completing a task. */
  unstuck: number;
  rate: number | null;
}

const WINDOW_MS = 24 * 3_600_000;
const ACTION_EVENTS = new Set(["task_started", "task_completed"]);

/**
 * UNSTUCK_RATE: a user opens the app while something is overdue, then starts
 * or completes an actionable task within a day. Sessions with nothing overdue
 * don't count either way — they weren't stuck.
 */
export function computeUnstuckRate(events: AnalyticsEventLike[]): UnstuckResult {
  const actionTimes = events
    .filter((e) => ACTION_EVENTS.has(e.name))
    .map((e) => new Date(e.createdAt).getTime())
    .sort((a, b) => a - b);

  const stuckSessions = events.filter(
    (e) => e.name === "session_opened" && Number(e.properties?.overdue_count ?? 0) > 0,
  );

  let unstuck = 0;
  for (const session of stuckSessions) {
    const opened = new Date(session.createdAt).getTime();
    if (actionTimes.some((t) => t >= opened && t - opened <= WINDOW_MS)) unstuck++;
  }

  return {
    sessions: stuckSessions.length,
    unstuck,
    rate: stuckSessions.length === 0 ? null : unstuck / stuckSessions.length,
  };
}
