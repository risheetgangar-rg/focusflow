import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as reminderRepo from "@/repositories/reminder-repository";
import * as taskRepo from "@/repositories/task-repository";
import * as habitRepo from "@/repositories/habit-repository";
import { generateHabitReminders, generateTaskReminders, isWithinQuietHours } from "@/services/reminder-service";
import { sendPushNotification } from "@/services/notification-service";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase isn't connected." }, { status: 503 });
  }

  const now = new Date();
  const userIds = await reminderRepo.listActiveUserIds(admin);

  let created = 0;
  let sent = 0;

  for (const userId of userIds) {
    const prefs = await reminderRepo.getPreferences(admin, userId);
    if (isWithinQuietHours(now, prefs)) continue;

    const [tasks, habits] = await Promise.all([
      taskRepo.listTasks(admin, userId),
      habitRepo.listHabits(admin, userId),
    ]);

    const candidates = [
      ...generateTaskReminders(tasks, now, prefs),
      ...generateHabitReminders(habits, now, prefs),
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
