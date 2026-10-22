import { zonedHour } from "@/lib/dates/tz";
import { TASK_TYPES } from "@/lib/tasks/personal";
import type { Task } from "@/types/task";

/*
 * "Mind Unwrapped": a short, kind look back at the week, told as tap-through
 * cards. It only ever counts what you DID, never what you did not.
 */

export interface WrappedStats {
  done: number;
  /** "Calls and replies", or null when nothing's finished yet. */
  topType: string | null;
  /** "mornings", "afternoons", "evenings" or "late nights". */
  bestTime: string | null;
  /** "Tuesday". */
  bestDay: string | null;
  /** Total minutes spent locked in. */
  focusMinutes: number;
  longestFocus: number;
  /** Times they came back after a gap and moved their plan forward. */
  comebacks: number;
  /** One word for the week. */
  word: string;
  /** Dread meter: finished things that felt easier than expected. */
  easier: number;
  /** A first task done, to name on the summary card. */
  highlight: string | null;
}

const TIMES = [
  { label: "late nights", test: (h: number) => h < 5 },
  { label: "mornings", test: (h: number) => h < 12 },
  { label: "afternoons", test: (h: number) => h < 17 },
  { label: "evenings", test: (h: number) => h < 22 },
  { label: "late nights", test: () => true },
];

function mostCommon<T>(values: T[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = 0;
  for (const [v, c] of counts) if (c > bestCount) [best, bestCount] = [v, c];
  return best;
}

export function wordForWeek(done: number, comebacks: number): string {
  if (comebacks > 0 && done > 0) return "Resilient";
  if (done === 0) return "Resting";
  if (done <= 3) return "Steady";
  if (done <= 9) return "Rolling";
  return "Unstoppable";
}

export function computeWrapped(
  completed: Pick<Task, "completedAt" | "taskType" | "title" | "felt">[],
  focus: { actualMinutes: number | null }[],
  comebacks: number,
  tz: string,
): WrappedStats {
  const done = completed.filter((t) => t.completedAt);
  const hours = done.map((t) => zonedHour(new Date(t.completedAt!), tz));
  const days = done.map((t) =>
    new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: tz }).format(new Date(t.completedAt!)),
  );
  const topTypeValue = mostCommon(done.map((t) => t.taskType).filter((t) => t !== "other"));
  const bestHourLabel = mostCommon(hours.map((h) => TIMES.find((t) => t.test(h))!.label));
  const minutes = focus.map((f) => f.actualMinutes ?? 0).filter((m) => m > 0);

  return {
    done: done.length,
    topType: topTypeValue ? (TASK_TYPES.find((t) => t.value === topTypeValue)?.label ?? null) : null,
    bestTime: bestHourLabel,
    bestDay: mostCommon(days),
    focusMinutes: minutes.reduce((a, b) => a + b, 0),
    longestFocus: minutes.length ? Math.max(...minutes) : 0,
    comebacks,
    word: wordForWeek(done.length, comebacks),
    highlight: done[0]?.title ?? null,
    easier: done.filter((t) => t.felt === "easier").length,
  };
}
