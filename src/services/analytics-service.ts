import type { SupabaseClient } from "@supabase/supabase-js";

export type AnalyticsEventName =
  | "session_opened"
  | "task_created"
  | "task_started"
  | "task_completed"
  | "task_rescheduled"
  | "habit_completed"
  | "brain_dump_used"
  | "voice_used"
  | "focus_started"
  | "focus_completed"
  | "rescue_opened"
  | "rescue_completed"
  | "quest_completed"
  | "notification_opened"
  | "notification_dismissed"
  | "xp_awarded"
  | "level_up";

/** Fire-and-forget: a failed analytics write must never break the action the user actually took. */
export async function track(
  supabase: SupabaseClient,
  userId: string,
  name: AnalyticsEventName,
  properties: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { error } = await supabase
      .from("analytics_events")
      .insert({ user_id: userId, name, properties });
    if (error) console.warn(`analytics: ${name} not recorded (${error.message})`);
  } catch (err) {
    console.warn(`analytics: ${name} not recorded`, err);
  }
}

export async function listRecentEvents(
  supabase: SupabaseClient,
  userId: string,
  sinceIso: string,
): Promise<{ name: string; createdAt: string; properties: Record<string, unknown> }[]> {
  const { data, error } = await supabase
    .from("analytics_events")
    .select("name, created_at, properties")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((r) => ({ name: r.name, createdAt: r.created_at, properties: r.properties ?? {} }));
}
