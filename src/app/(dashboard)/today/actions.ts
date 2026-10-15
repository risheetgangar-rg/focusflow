"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { track, type AnalyticsEventName } from "@/services/analytics-service";
import { claimComeback } from "@/services/gamification-service";
import { todayDateString } from "@/services/habit-service";
import { completeSideQuest } from "@/services/quest-service";
import * as taskRepo from "@/repositories/task-repository";
import { isOverdue } from "@/lib/dates/overdue";

export async function completeSideQuestAction(questId: string): Promise<number> {
  const session = await getSession();
  if (!session) return 0;
  const xp = await completeSideQuest(session.supabase, session.userId, questId);
  revalidatePath("/today");
  return xp;
}

/** "Welcome back" bonus, granted on return itself (once a day, never punishing absence). */
export async function claimComebackAction(): Promise<number> {
  const session = await getSession();
  if (!session || session.profile.gamificationMode === "off") return 0;
  const xp = await claimComeback(
    session.supabase,
    session.userId,
    todayDateString(new Date(), session.timezone),
  );
  if (xp > 0) revalidatePath("/today");
  return xp;
}

/** Called once per browser session so UNSTUCK_RATE has a denominator. */
export async function trackSessionOpenedAction(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const tasks = await taskRepo.listTasks(session.supabase, session.userId);
  const now = new Date();
  const pending = tasks.filter((t) => t.status === "pending");
  await track(session.supabase, session.userId, "session_opened", {
    pending_count: pending.length,
    overdue_count: pending.filter((t) => isOverdue(t.dueAt, t.status, now)).length,
  });
}

const CLIENT_EVENTS = new Set<AnalyticsEventName>([
  "rescue_opened",
  "notification_opened",
  "notification_dismissed",
]);

export async function trackClientEventAction(name: AnalyticsEventName): Promise<void> {
  if (!CLIENT_EVENTS.has(name)) return;
  const session = await getSession();
  if (!session) return;
  await track(session.supabase, session.userId, name);
}
