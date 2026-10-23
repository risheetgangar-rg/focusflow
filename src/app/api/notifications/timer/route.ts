import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isJobAuthorized } from "@/lib/notifications/job-auth";
import * as reminderRepo from "@/repositories/reminder-repository";
import { sendPushNotification } from "@/services/notification-service";

export const dynamic = "force-dynamic";

/**
 * "Time's up!" at the exact minute a Lock-in timer ends, even with the screen
 * off or the app closed. The database checks every minute and only calls this
 * when a timer has actually run out.
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase isn't connected." }, { status: 503 });
  if (!(await isJobAuthorized(request, admin))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  const { data: sessions } = await admin
    .from("focus_sessions")
    .select("id, user_id, task_id, started_at, planned_minutes")
    .is("ended_at", null)
    .is("timeup_sent_at", null)
    .not("planned_minutes", "is", null)
    .gte("started_at", new Date(now - 6 * 3_600_000).toISOString());

  let sent = 0;
  for (const s of sessions ?? []) {
    const ends = Date.parse(s.started_at as string) + (s.planned_minutes as number) * 60_000;
    if (ends > now) continue;
    // Claim it first, so two runs can never send the same alert twice.
    const { data: claimed } = await admin
      .from("focus_sessions")
      .update({ timeup_sent_at: new Date(now).toISOString() })
      .eq("id", s.id)
      .is("timeup_sent_at", null)
      .select("id");
    if (!claimed?.length) continue;
    // Marked as handled either way, but guests only look around: no alert.
    const { data: account } = await admin.auth.admin.getUserById(s.user_id as string);
    if (!account?.user || account.user.is_anonymous) continue;

    const { data: task } = await admin.from("tasks").select("title").eq("id", s.task_id).maybeSingle();
    for (const sub of await reminderRepo.listSubscriptionsForUser(admin, s.user_id as string)) {
      const result = await sendPushNotification(sub, {
        title: "⏰ Time’s up!",
        body: task?.title ? `“${task.title}” · Tap ✓ if you finished, or open to keep going.` : "Tap to see how it went.",
        url: "/today",
        taskId: (s.task_id as string | null) ?? undefined,
        tag: "unstuck-timer",
        urgent: true,
      });
      if (result.ok) sent++;
      if (result.expired) await reminderRepo.deleteSubscription(admin, sub.endpoint);
    }
  }
  return NextResponse.json({ ok: true, sent });
}
