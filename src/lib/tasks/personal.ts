import { addDaysToDateString, zonedDateString } from "@/lib/dates/tz";
import type { Subtask, Task, TaskType } from "@/types/task";

/* ---------- Task types ---------- */

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "bills", label: "Bills and money" },
  { value: "work", label: "Work or study" },
  { value: "calls", label: "Calls and replies" },
  { value: "home", label: "Home" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

/** The five things someone can say they mostly need help with (everything except "Other"). */
export const HELP_AREAS = TASK_TYPES.filter((t) => t.value !== "other");

export function isTaskType(value: unknown): value is TaskType {
  return TASK_TYPES.some((t) => t.value === value);
}

const KEYWORDS: [TaskType, RegExp][] = [
  ["bills", /\b(pay|bill|bills|rent|emi|loan|card|upi|fees?|invoice|tax|recharge|subscription|insurance|bank)\b/i],
  ["calls", /\b(call|reply|replies|email|e-mail|mail|text|message|whatsapp|dm|ring|follow ?up|respond|ping)\b/i],
  ["health", /\b(doctor|dentist|medicine|meds|pharmacy|gym|workout|therapy|therapist|appointment|checkup|blood|clinic)\b/i],
  ["work", /\b(study|exam|assignment|homework|slides|presentation|report|project|essay|code|deck|meeting|client|work|notes|revise)\b/i],
  ["home", /\b(clean|laundry|dishes|cook|groceries|grocery|tidy|desk|room|kitchen|trash|garbage|plants?|fix|repair)\b/i],
];

/** A best guess at the type from the words in the title. The person can always change it. */
export function guessTaskType(title: string): TaskType {
  return KEYWORDS.find(([, pattern]) => pattern.test(title))?.[0] ?? "other";
}

/* ---------- First steps ---------- */

/** A smarter first step than a plain to-do list gives, based on the kind of task. */
export function typeFirstStep(task: Pick<Task, "taskType" | "title">): string {
  switch (task.taskType) {
    case "bills":
      return "Open your bank or UPI app";
    case "calls":
      return /\bcall|ring\b/i.test(task.title) ? "Call for 5 minutes; you can end it" : "Open the chat and type hi";
    case "work":
      return "Open the file and write the first line";
    case "home":
      return "Set 5 minutes and do one corner";
    case "health":
      return "Find the number or the booking page";
    default:
      return "Get the first thing you need open in front of you";
  }
}

export function firstStepFor(task: Pick<Task, "taskType" | "title">, subtasks: Subtask[] = []): string {
  return subtasks.find((s) => !s.completed)?.title ?? typeFirstStep(task);
}

/** Bills keep their amount in the notes as "Amount: ...", so it can be shown next to the first step. */
export function billAmount(task: Pick<Task, "description">): string | null {
  return task.description?.match(/Amount:\s*([^\n]+)/)?.[1]?.trim() ?? null;
}

/* ---------- Urgency ---------- */

export type Urgency = "now" | "soon" | "whenever" | "parked";

export const URGENCY_LABEL: Record<Urgency, string> = {
  now: "Now",
  soon: "Soon",
  whenever: "Whenever",
  parked: "Parked",
};

const HOUR = 3_600_000;
const BUMP: Record<Exclude<Urgency, "parked">, Exclude<Urgency, "parked">> = { whenever: "soon", soon: "now", now: "now" };

/**
 * Worked out from the deadline, never set by hand: Now is the next 24 hours,
 * Soon the next 3 days, Whenever anything later (or no date). A "Must do" star
 * counts as one level more urgent. A date that has passed is simply "Parked".
 */
export function urgencyOf(task: Pick<Task, "dueAt" | "mustDo">, now: Date): Urgency {
  let level: Exclude<Urgency, "parked"> = "whenever";
  if (task.dueAt) {
    const hours = (new Date(task.dueAt).getTime() - now.getTime()) / HOUR;
    if (hours < 0) return "parked";
    if (hours <= 24) level = "now";
    else if (hours <= 72) level = "soon";
  }
  return task.mustDo ? BUMP[level] : level;
}

/* ---------- Why this task, and which one ---------- */

/** The short reason under the task, like "Due today · 5 min" or "No rush". */
export function reasonFor(task: Task, now: Date, tz: string): string {
  const minutes = task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : "";
  if (task.dueAt && new Date(task.dueAt).getTime() >= now.getTime()) {
    const today = zonedDateString(now, tz);
    const due = zonedDateString(new Date(task.dueAt), tz);
    const minutesAway = (new Date(task.dueAt).getTime() - now.getTime()) / 60_000;
    if (minutesAway <= 90) return `In ${Math.max(1, Math.round(minutesAway))} min`;
    if (due === today) return `Due today${minutes}`;
    if (due === addDaysToDateString(today, 1)) return `Due tomorrow${minutes}`;
  }
  if (task.mustDo) return `Must do${minutes}`;
  return task.estimatedMinutes ? `No rush · ${task.estimatedMinutes} min` : "No rush";
}

function effort(task: Task): number {
  return task.estimatedMinutes ?? task.friction * 10;
}

/** Snoozed ("Not now") or planned for later: not shown until its time comes. */
function waiting(task: Task, now: Date): boolean {
  return task.scheduledAt !== null && new Date(task.scheduledAt).getTime() - now.getTime() > 10 * 60_000;
}

/**
 * The order Today offers tasks in: starred tasks and the kinds the person
 * cares about first, then the closest deadline; with no dates, the smallest.
 * Tasks whose date has passed come last (they're parked, not urgent).
 */
export function rankForToday(tasks: Task[], now: Date, helpAreas: string[] = []): Task[] {
  const cares = (t: Task) => t.mustDo || helpAreas.includes(t.taskType);
  const dueIn = (t: Task) => (t.dueAt ? new Date(t.dueAt).getTime() - now.getTime() : Infinity);
  const parked = (t: Task) => dueIn(t) < 0;

  return tasks
    // Reminders are nudges, not things to lock in on, so they never take the one card.
    .filter((t) => t.status === "pending" && t.kind !== "reminder" && !t.isBoss && !waiting(t, now))
    .sort(
      (a, b) =>
        Number(parked(a)) - Number(parked(b)) ||
        Number(cares(b)) - Number(cares(a)) ||
        dueIn(a) - dueIn(b) ||
        effort(a) - effort(b),
    );
}

/** A day holds at most this many tasks; the rest wait quietly behind "Later". */
export const TODAY_LIMIT = 3;
