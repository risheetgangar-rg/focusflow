import type { Task } from "@/types/task";

/*
 * One colour per task instead of a row of labels:
 *   blue   – parked: its day has passed, still worth doing
 *   red    – work on it right now: High or Critical, or due within a day
 *   yellow – soon: normal priority
 *   green  – whenever: low priority, nothing pressing
 * As a date gets close, a task moves up a colour, so nothing important sneaks up.
 */

export type Tone = "parked" | "now" | "soon" | "later";

const HOUR = 3_600_000;

export function toneOf(task: Pick<Task, "dueAt" | "priority" | "mustDo">, now: Date): Tone {
  const left = task.dueAt ? Date.parse(task.dueAt) - now.getTime() : Infinity;
  if (left < 0) return "parked";
  if (task.priority === "critical" || task.priority === "high" || task.mustDo) return "now";
  if (task.priority === "low") return left <= 48 * HOUR ? "soon" : "later";
  return left <= 24 * HOUR ? "now" : "soon";
}

export const TONE_ORDER: Tone[] = ["parked", "now", "soon", "later"];

export const TONE_LABEL: Record<Tone, string> = {
  parked: "Parked",
  now: "Work on it right now",
  soon: "Soon",
  later: "Whenever",
};

/** Row and card colours: a solid edge, a soft wash, and the matching dot for the key. */
export const TONE_STYLE: Record<Tone, { edge: string; wash: string; dot: string }> = {
  parked: { edge: "border-l-[#2f6fed]", wash: "bg-[#2f6fed]/[0.06]", dot: "bg-[#2f6fed]" },
  now: { edge: "border-l-[#e5484d]", wash: "bg-[#e5484d]/[0.06]", dot: "bg-[#e5484d]" },
  soon: { edge: "border-l-[#f59e0b]", wash: "bg-[#f59e0b]/[0.08]", dot: "bg-[#f59e0b]" },
  later: { edge: "border-l-[#22a35a]", wash: "bg-[#22a35a]/[0.06]", dot: "bg-[#22a35a]" },
};
