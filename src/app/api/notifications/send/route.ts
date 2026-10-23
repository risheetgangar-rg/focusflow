import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as reminderRepo from "@/repositories/reminder-repository";
import * as taskRepo from "@/repositories/task-repository";
import * as habitRepo from "@/repositories/habit-repository";
import { generateHabitReminders, generateTaskReminders, isWithinQuietHours } from "@/services/reminder-service";
import { sendPushNotification } from "@/services/notification-service";
import { resolveTimezone, zonedWallClock } from "@/lib/dates/tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfile } from "@/repositories/profile-repository";
import { nextUpFor } from "@/services/win-service";

export const dynamic = "force-dynamic";

/**
 * Two callers are allowed: Vercel's daily cron (CRON_SECRET), and the
 * Supabase scheduler that runs every 15 minutes, which sends a random key
 * that only lives inside the database (public.job_tokens, service role only).
 */
async function isAuthorized(request: NextRequest, admin: SupabaseClient): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) return true;
  const token = request.headers.get("x-job-token");
  if (!token) return false;
  const { data } = await admin.from("job_tokens").select("token").eq("name", "notify").maybeSingle();
  return Boolean(data?.token) && data!.token === token;
}

export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase isn't connected." }, { status: 503 });
  }
  if (!(await isAuthorized(request, admin))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const userIds = await reminderRepo.listActiveUserIds(admin);

  let created = 0;
  let sent = 0;

  for (const userId of userIds) {
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
    if (hour >= 7 && hour < 23) {
      const profile = await getProfile(admin, userId);
      const next = await nextUpFor(admin, userId, resolveTimezone(timezone), profile?.focusAreas ?? []);
      for (const sub of await reminderRepo.listSubscriptionsForUser(admin, userId)) {
        const result = await sendPushNotification(sub, {
          title: next?.title ?? "You're clear for now",
          body: next ? `Next up · ${next.when ?? "Whenever"}` : "Nothing waiting.",
          url: "/today",
          next,
        });
        if (result.ok) sent++;
        if (result.expired) await reminderRepo.deleteSubscription(admin, sub.endpoint);
      }
    }

    const [tasks, habits] = await Promise.all([
      taskRepo.listTasks(admin, userId),
      habitRepo.listHabits(admin, userId),
    ]);

    const candidates = [
      ...generateTaskReminders(tasks, now, prefs),
      ...generateHabitReminders(habits, wallClock, prefs),
    ];
    if (candidates.length === 0) continue;

    const subscriptions = await reminderRepo.listSubscriptionsForUser(admin, userId);

    for (const candidate of candidates) {
      const reminderId = await reminderRepo.insertReminderIfNew(admin, userId, candidate);
      if (!reminderId) continue;
      created++;

      let deliveredToAny = false;
      for (const sub of subscriptions) {
        const result = await sendPushNotification(sub, {
          title: candidate.title,
          body: candidate.body,
          url: candidate.taskId ? "/tasks" : "/habits",
          taskId: candidate.taskId ?? undefined,
        });
        if (result.ok) {
          sent++;
          deliveredToAny = true;
        }
        if (result.expired) await reminderRepo.deleteSubscription(admin, sub.endpoint);
      }
      if (deliveredToAny) await reminderRepo.markReminderSent(admin, reminderId);
    }
  }

  return NextResponse.json({ ok: true, created, sent });
}
