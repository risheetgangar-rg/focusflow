import type { SupabaseClient } from "@supabase/supabase-js";

export interface FocusSession {
  id: string;
  taskId: string | null;
  plannedMinutes: number | null;
  startedAt: string;
}

export async function startFocusSession(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  plannedMinutes: number | null,
): Promise<FocusSession> {
  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({ user_id: userId, task_id: taskId, planned_minutes: plannedMinutes })
    .select("*")
    .single();

  if (error) throw error;
  return {
    id: data.id,
    taskId: data.task_id,
    plannedMinutes: data.planned_minutes,
    startedAt: data.started_at,
  };
}

export async function endFocusSession(
  supabase: SupabaseClient,
  sessionId: string,
  completed: boolean,
): Promise<void> {
  const { data: session, error: fetchError } = await supabase
    .from("focus_sessions")
    .select("started_at")
    .eq("id", sessionId)
    .single();
  if (fetchError) throw fetchError;

  const startedAt = new Date(session.started_at).getTime();
  const actualMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));

  const { error } = await supabase
    .from("focus_sessions")
    .update({ ended_at: new Date().toISOString(), actual_minutes: actualMinutes, completed })
    .eq("id", sessionId);

  if (error) throw error;
}
