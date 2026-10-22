"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { zonedDateString } from "@/lib/dates/tz";
import { UNDO_HOURS, calendarDaysBetween, planMoveForward } from "@/lib/welcome-back/rules";
import { updateProfile } from "@/repositories/profile-repository";
import * as taskRepo from "@/repositories/task-repository";
import * as welcomeRepo from "@/repositories/welcome-repository";
import { track } from "@/services/analytics-service";

const DAY_MS = 86_400_000;

function refresh() {
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/rescue");
}

/** How many days they were away (at least 1, so the button always does something). */
async function daysAwayFor() {
  const session = await getSession();
  if (!session) return null;
  const since = session.profile.awaySince ? new Date(session.profile.awaySince) : new Date();
  return { session, days: Math.max(1, calendarDaysBetween(since, new Date(), session.timezone)) };
}

/** What "I was away" would change, so the person sees every new date before anything moves. */
export async function previewMoveForwardAction() {
  const ctx = await daysAwayFor();
  if (!ctx) return { days: 0, changes: [] };
  const { session, days } = ctx;
  const tasks = await taskRepo.listVisibleTasks(session.supabase, session.userId, new Date());
  return { days, changes: planMoveForward(tasks, days, new Date()) };
}

/** "I was away": move everything that went late forward by the days away. Undo lasts 24 hours. */
export async function moveForwardAction(): Promise<{ ok: boolean; moved: number; shiftId?: string }> {
  const ctx = await daysAwayFor();
  if (!ctx) return { ok: false, moved: 0 };
  const { session, days } = ctx;
  const { supabase, userId } = session;

  const tasks = await taskRepo.listVisibleTasks(supabase, userId, new Date());
  const changes = planMoveForward(tasks, days, new Date());
  if (changes.length === 0) return { ok: true, moved: 0 };

  // Save the old dates first, so Undo can always put them back exactly.
  const shift = await welcomeRepo.recordShift(supabase, userId, days, changes);
  await welcomeRepo.setTaskDates(
    supabase,
    changes.map((c) => ({ taskId: c.taskId, dueAt: c.newDueAt, scheduledAt: c.newScheduledAt })),
  );
  await track(supabase, userId, "rescue_completed", { kind: "move_forward", days, moved: changes.length });

  refresh();
  return { ok: true, moved: changes.length, shiftId: shift.id };
}

export async function undoMoveForwardAction(shiftId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in again." };
  const shift = await welcomeRepo.getShift(session.supabase, shiftId);
  if (!shift || shift.undoneAt) return { ok: false, error: "That's already been undone." };
  if (Date.now() - new Date(shift.createdAt).getTime() > UNDO_HOURS * 3_600_000) {
    return { ok: false, error: "Undo is only available for a day." };
  }

  await welcomeRepo.setTaskDates(
    session.supabase,
    shift.changes.map((c) => ({ taskId: c.taskId, dueAt: c.oldDueAt, scheduledAt: c.oldScheduledAt })),
  );
  await welcomeRepo.markShiftUndone(session.supabase, shift.id);
  await track(session.supabase, session.userId, "rescue_completed", { kind: "undo_move", moved: shift.changes.length });
  refresh();
  return { ok: true };
}

/** Leave welcome-back mode and see the normal Today screen. */
export async function showFullListAction(reason: "dismissed" | "started" | "moved" = "dismissed") {
  const session = await getSession();
  if (!session) return;
  await updateProfile(session.supabase, session.userId, {
    awaySince: null,
    welcomeDismissedOn: zonedDateString(new Date(), session.timezone),
  });
  await track(session.supabase, session.userId, "rescue_completed", { kind: "welcome_closed", reason });
  refresh();
}

/** Demo helper: pretend they were away `days` days (everything open slides back in time by that much). */
export async function pretendAwayAction(days = 4) {
  const session = await getSession();
  if (!session) return;
  const { supabase, userId } = session;
  const back = days * DAY_MS;

  const tasks = (await taskRepo.listVisibleTasks(supabase, userId, new Date())).filter((t) => t.status === "pending");
  await welcomeRepo.setTaskDates(
    supabase,
    tasks
      .filter((t) => t.dueAt || t.scheduledAt)
      .map((t) => ({
        taskId: t.id,
        dueAt: t.dueAt ? new Date(new Date(t.dueAt).getTime() - back).toISOString() : null,
        scheduledAt: t.scheduledAt ? new Date(new Date(t.scheduledAt).getTime() - back).toISOString() : null,
      })),
  );
  const away = new Date(Date.now() - back).toISOString();
  await updateProfile(supabase, userId, { lastSeenAt: away, awaySince: away, welcomeDismissedOn: null });
  refresh();
}

/** The one optional question on the first welcome back. Answer is stored only as a product signal. */
export async function answerCleanupQuestionAction(answer: string) {
  const allowed = ["under_5", "5_15", "15_30", "over_30", "never_tried"];
  if (!allowed.includes(answer)) return;
  const session = await getSession();
  if (!session) return;
  await track(session.supabase, session.userId, "rescue_opened", { question: "cleanup_minutes", answer });
}
