import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationPreferences, PushSubscriptionRecord, ReminderCandidate } from "@/types/reminder";

export async function listActiveUserIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("push_subscriptions").select("user_id");
  if (error) throw error;
  return Array.from(new Set((data as { user_id: string }[]).map((r) => r.user_id)));
}

export async function getPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "notify_task_reminders, notify_habit_reminders, notify_deadline_reminders, notify_rescue_reminders, quiet_hours_start, quiet_hours_end",
    )
    .eq("id", userId)
    .single();

  if (error) throw error;
  return {
    notifyTaskReminders: data.notify_task_reminders,
    notifyHabitReminders: data.notify_habit_reminders,
    notifyDeadlineReminders: data.notify_deadline_reminders,
    notifyRescueReminders: data.notify_rescue_reminders,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
  };
}

export async function updatePreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: Partial<NotificationPreferences>,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(prefs.notifyTaskReminders !== undefined && { notify_task_reminders: prefs.notifyTaskReminders }),
      ...(prefs.notifyHabitReminders !== undefined && { notify_habit_reminders: prefs.notifyHabitReminders }),
      ...(prefs.notifyDeadlineReminders !== undefined && {
        notify_deadline_reminders: prefs.notifyDeadlineReminders,
      }),
      ...(prefs.notifyRescueReminders !== undefined && { notify_rescue_reminders: prefs.notifyRescueReminders }),
      ...(prefs.quietHoursStart !== undefined && { quiet_hours_start: prefs.quietHoursStart }),
      ...(prefs.quietHoursEnd !== undefined && { quiet_hours_end: prefs.quietHoursEnd }),
    })
    .eq("id", userId);
  if (error) throw error;
}

export async function upsertSubscription(
  supabase: SupabaseClient,
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string; userAgent?: string },
): Promise<void> {
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      user_agent: sub.userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

export async function deleteSubscription(supabase: SupabaseClient, endpoint: string): Promise<void> {
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

export async function listSubscriptionsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<PushSubscriptionRecord[]> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data as { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; user_agent: string | null }[]).map(
    (r) => ({
      id: r.id,
      userId: r.user_id,
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth,
      userAgent: r.user_agent,
    }),
  );
}

/** Insert a reminder if one isn't already pending/sent for the same target — relies on the migration's partial unique indexes. */
export async function insertReminderIfNew(
  supabase: SupabaseClient,
  userId: string,
  candidate: ReminderCandidate,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      user_id: userId,
      task_id: candidate.taskId,
      habit_id: candidate.habitId,
      reminder_type: candidate.reminderType,
      scheduled_for: candidate.scheduledFor,
      notification_title: candidate.title,
      notification_body: candidate.body,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return null; // unique violation = duplicate, expected
    throw error;
  }
  return data.id;
}

export async function markReminderSent(supabase: SupabaseClient, reminderId: string): Promise<void> {
  const { error } = await supabase.from("reminders").update({ status: "sent" }).eq("id", reminderId);
  if (error) throw error;
}

export async function markReminderDismissed(supabase: SupabaseClient, reminderId: string): Promise<void> {
  const { error } = await supabase
    .from("reminders")
    .update({ status: "dismissed" })
    .eq("id", reminderId);
  if (error) throw error;
}

export async function listPendingRemindersForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return data;
}
