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
