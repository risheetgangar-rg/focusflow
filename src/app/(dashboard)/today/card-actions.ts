"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { addDaysToDateString, zonedDateString, zonedParts, zonedTimeToUtc } from "@/lib/dates/tz";
import { guessTaskType, isTaskType } from "@/lib/tasks/personal";
import * as taskRepo from "@/repositories/task-repository";
import { track } from "@/services/analytics-service";
import { dueFrom } from "@/lib/tasks/when";
import { finishWithWin, type Win } from "@/services/win-service";

function refresh() {
  revalidatePath("/today");
  revalidatePath("/tasks");
}

/** "Not now" / "Park it": the task waits until tomorrow morning. Nothing is lost and no date is changed. */
export async function notNowAction(taskId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const tomorrow = addDaysToDateString(zonedDateString(new Date(), session.timezone), 1);
  const morning = zonedTimeToUtc(tomorrow, "08:00", session.timezone).toISOString();
  await taskRepo.rescheduleTask(session.supabase, taskId, morning, undefined, false);
  await track(session.supabase, session.userId, "task_rescheduled", { task_id: taskId, target: "not_now" });
  refresh();
}

const addSchema = z.object({
  title: z.string().trim().min(1, "Give it a few words.").max(200),
  when: z.enum(["today", "tomorrow", "week", "someday"]),
  taskType: z.string().optional(),
  amount: z.string().trim().max(40).optional(),
  mustDo: z.boolean().optional(),
});

/** The "Add a task" box: a title and a rough when. The kind of task is guessed from the words. */
export async function addTaskAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check that again?" };
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  const { title, when, amount, mustDo } = parsed.data;
  const tz = session.timezone;
  const today = zonedDateString(new Date(), tz);
  const weekday = zonedParts(new Date(), tz).weekday;
  const dueDay =
    when === "today"
      ? today
      : when === "tomorrow"
        ? addDaysToDateString(today, 1)
        : when === "week"
          ? addDaysToDateString(today, weekday === 0 ? 7 : 7 - weekday)
          : null;

  const taskType = isTaskType(parsed.data.taskType) ? parsed.data.taskType : guessTaskType(title);
  await taskRepo.createTask(session.supabase, session.userId, {
    title,
    taskType,
    mustDo: mustDo ?? false,
    description: taskType === "bills" && amount ? `Amount: ${amount}` : null,
    dueAt: dueDay ? zonedTimeToUtc(dueDay, "21:00", tz).toISOString() : null,
  });
  await track(session.supabase, session.userId, "task_created", { source: "add_box", when });
  refresh();
  return { ok: true };
}

const feltSchema = z.enum(["easier", "same", "harder"]);

/** The dread meter: one optional tap after finishing. The Ta-Da List counts the "easier" ones. */
export async function rateFeltAction(taskId: string, felt: unknown): Promise<void> {
  const parsed = feltSchema.safeParse(felt);
  const session = await getSession();
  if (!parsed.success || !session) return;
  await session.supabase.from("tasks").update({ felt: parsed.data }).eq("id", taskId).eq("user_id", session.userId);
  revalidatePath("/review");
}

const itemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  kind: z.enum(["task", "reminder"]),
  level: z.enum(["low", "medium", "high", "critical"]),
  /** Non-negotiables repeat on a rhythm; everything else is a one-off. */
  repeat: z.enum(["daily", "twice_weekly", "thrice_weekly", "weekly"]).nullable().optional(),
  /** The day (YYYY-MM-DD) and time (HH:MM) as picked, in the person's own clock. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  /** Last day a repeating one comes back. */
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  minutes: z.number().int().positive().max(600).nullable().optional(),
});
const manySchema = z.array(itemSchema).min(1).max(20);

/** One priority; High and Critical count as "Must do". */
const LEVEL = {
  low: { priority: "low", mustDo: false },
  medium: { priority: "medium", mustDo: false },
  high: { priority: "high", mustDo: true },
  critical: { priority: "critical", mustDo: true },
} as const;

/** Voice add: everything said out loud, checked by the person, saved in one go. */
export async function addManyAction(input: unknown): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const parsed = manySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Something in the list needs a look." };
  if (parsed.data.some((i) => i.kind === "reminder" && !i.time)) return { ok: false, error: "Reminders need a time." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  for (const item of parsed.data) {
    await taskRepo.createTask(session.supabase, session.userId, {
      title: item.title,
      kind: item.kind,
      taskType: guessTaskType(item.title),
      dueAt: dueFrom(item, session.timezone),
      recurrenceRule: item.repeat ?? null,
      repeatUntil: item.repeat ? (item.until ?? null) : null,
      estimatedMinutes: item.kind === "task" ? (item.minutes ?? null) : null,
      ...LEVEL[item.level],
      source: "voice",
    });
  }
  await track(session.supabase, session.userId, "task_created", { source: "voice_add", count: parsed.data.length });
  refresh();
  return { ok: true, count: parsed.data.length };
}

/** Done from Today, Tasks or Lock-in: completes it and returns the XP, any new medals, and what's next. */
export async function finishTaskAction(taskId: string, focusSessionId?: string | null): Promise<Win | null> {
  const session = await getSession();
  if (!session) return null;
  const win = await finishWithWin(session, taskId, focusSessionId);
  refresh();
  revalidatePath("/review");
  return win;
}
