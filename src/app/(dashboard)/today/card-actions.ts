"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { addDaysToDateString, zonedDateString, zonedParts, zonedTimeToUtc } from "@/lib/dates/tz";
import { guessTaskType, isTaskType } from "@/lib/tasks/personal";
import * as taskRepo from "@/repositories/task-repository";
import { track } from "@/services/analytics-service";

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
  level: z.enum(["high", "normal", "low"]),
  /** Exact date and time, already turned into an ISO string by the browser. */
  at: z.string().datetime().nullable(),
});
const manySchema = z.array(itemSchema).min(1).max(20);

const LEVEL = {
  high: { priority: "high", mustDo: true },
  normal: { priority: "medium", mustDo: false },
  low: { priority: "low", mustDo: false },
} as const;

/** Voice add: everything said out loud, checked by the person, saved in one go. */
export async function addManyAction(input: unknown): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const parsed = manySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Something in the list needs a look." };
  if (parsed.data.some((i) => i.kind === "reminder" && !i.at)) return { ok: false, error: "Reminders need a time." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  for (const item of parsed.data) {
    await taskRepo.createTask(session.supabase, session.userId, {
      title: item.title,
      kind: item.kind,
      taskType: guessTaskType(item.title),
      dueAt: item.at,
      ...LEVEL[item.level],
      source: "voice",
    });
  }
  await track(session.supabase, session.userId, "task_created", { source: "voice_add", count: parsed.data.length });
  refresh();
  return { ok: true, count: parsed.data.length };
}
