import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as reminderRepo from "@/repositories/reminder-repository";
import * as taskRepo from "@/repositories/task-repository";
import * as habitRepo from "@/repositories/habit-repository";
import { generateHabitReminders, generateTaskReminders, isWithinQuietHours } from "@/services/reminder-service";
import { sendPushNotification } from "@/services/notification-service";
import { resolveTimezone, zonedWallClock } from "@/lib/dates/tz";
import { isJobAuthorized } from "@/lib/notifications/job-auth";
import { getProfile } from "@/repositories/profile-repository";
import { nextUpFor } from "@/services/win-service";
import { comingUp, criticalNudge, nextUpLine, reminderDue, stillOpen } from "@/lib/notifications/copy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase isn't connected." }, { status: 503 });
  }
  if (!(await isJobAuthorized(request, admin))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const userIds = await reminderRepo.listActiveUserIds(admin);
  // This runs every 5 minutes. The "next up" card refreshes every 15, critical nudges every 30.
  const minute = now.getUTCMinutes();
  const refreshCard = minute % 15 < 5;
  const nudgeNow = minute % 30 < 5;
  const seed = (id: string) => `${id}${now.toISOString().slice(0, 13)}`;

  let created = 0;
  let sent = 0;

  for (const userId of userIds) {
    // Guests only look around: never notified, even if a sign-up slipped through.
    const { data: account } = await admin.auth.admin.getUserById(userId);
    if (!account?.user || account.user.is_anonymous) continue;
    const [prefs, timezone] = await Promise.all([
      reminderRepo.getPreferences(admin, userId),
      reminderRepo.getTimezone(admin, userId),
    ]);
    // Quiet hours and habit reminder times are wall-clock times in the user's own timezone.
    const wallClock = zonedWallClock(now, resolveTimezone(timezone));
    if (isWithinQuietHours(wallClock, prefs)) continue;

    // Keep the "next up" card in the notification bar fresh, even with the app closed.
    // Same tag every time, so it quietly replaces itself instead of piling up.
    const hour = wallClock.getHours();
    const awake = hour >= 7 && hour < 23;
    const profile = await getProfile(admin, userId);
    const name = profile?.displayName?.trim().split(/s+/)[0] || null;
    const subscriptions = await reminderRepo.listSubscriptionsForUser(admin, userId);
    const push = async (payload: Parameters<typeof sendPushNotification>[1]) => {
      let delivered = false;
      for (const sub of subscriptions) {
        const result = await sendPushNotification(sub, payload);
        if (result.ok) {
          sent++;
          delivered = true;
        }
        if (result.expired) await reminderRepo.deleteSubscription(admin, sub.endpoint);
      }
      return delivered;
    };

    const [tasks, habits] = await Promise.all([
      taskRepo.listTasks(admin, userId),
      habitRepo.listHabits(admin, userId),
    ]);

    // Keep the "next up" card in the notification bar fresh, even with the app closed.
    // Same tag every time, so it quietly replaces itself instead of piling up.
    if (awake && refreshCard) {
      const next = await nextUpFor(admin, userId, resolveTimezone(timezone), profile?.focusAreas ?? []);
      await push({ title: next?.title ?? "You're clear for now", body: next ? nextUpLine(next.when, seed(next.id)) : "Nothing waiting. Enjoy it.", url: "/today", next });
    }

    // Critical tasks get a personal nudge every 30 minutes until they're done (or snoozed).
    if (awake && nudgeNow) {
      const critical = tasks
        .filter((t) => t.status === "pending" && t.kind !== "reminder" && t.priority === "critical")
        .filter((t) => !t.scheduledAt || Date.parse(t.scheduledAt) <= now.getTime())
        .sort((a, b) => (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity))[0];
      if (critical) {
        const message = criticalNudge(critical.title, name, seed(critical.id));
        await push({ ...message, url: `/today?focus=${critical.id}`, taskId: critical.id, tag: `nudge-${critical.id}`, urgent: true });
      }
    }

    const candidates = [
      ...generateTaskReminders(tasks, now, prefs),
      ...generateHabitReminders(habits, wallClock, prefs),
    ];
    if (candidates.length === 0) continue;

    for (const candidate of candidates) {
      const task = candidate.taskId ? tasks.find((t) => t.id === candidate.taskId) : undefined;
      // Reminders arrive at their time (this runs every 5 minutes), not a quarter of an hour early.
      if (task?.kind === "reminder" && candidate.reminderType === "upcoming_task") {
        const minutesUntil = (Date.parse(task.dueAt ?? "") - now.getTime()) / 60_000;
        if (minutesUntil > 5) continue;
      }
      const reminderId = await reminderRepo.insertReminderIfNew(admin, userId, candidate);
      if (!reminderId) continue;
      created++;

      // Personal wording, in the person's name; habits keep their own text.
      const title = task?.title ?? candidate.title;
      const key = seed(candidate.taskId ?? reminderId);
      const message = !task
        ? { title: candidate.title, body: candidate.body }
        : candidate.reminderType === "missed_task"
          ? stillOpen(title, name, key)
          : task.kind === "reminder"
            ? reminderDue(title, name, key)
            : comingUp(title, Math.max(1, Math.round((Date.parse(task.dueAt ?? "") - now.getTime()) / 60_000)), name, key);
      const deliveredToAny = await push({
        ...message,
        url: candidate.taskId ? "/today" : "/habits",
        taskId: candidate.taskId ?? undefined,
        tag: candidate.taskId ? `task-${candidate.taskId}` : undefined,
        urgent: candidate.reminderType !== "missed_task",
      });
      if (deliveredToAny) await reminderRepo.markReminderSent(admin, reminderId);
    }
  }

  return NextResponse.json({ ok: true, created, sent });
}
