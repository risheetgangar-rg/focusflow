import type { SupabaseClient } from "@supabase/supabase-js";
import type { DateChange } from "@/lib/welcome-back/rules";

export interface DateShift {
  id: string;
  days: number;
  changes: DateChange[];
  createdAt: string;
  undoneAt: string | null;
}

interface DateShiftRow {
  id: string;
  days: number;
  changes: DateChange[];
  created_at: string;
  undone_at: string | null;
}

const toShift = (row: DateShiftRow): DateShift => ({
  id: row.id,
  days: row.days,
  changes: row.changes ?? [],
  createdAt: row.created_at,
  undoneAt: row.undone_at,
});

export async function recordShift(
  supabase: SupabaseClient,
  userId: string,
  days: number,
  changes: DateChange[],
): Promise<DateShift> {
  const { data, error } = await supabase
    .from("date_shifts")
    .insert({ user_id: userId, days, changes })
    .select("*")
    .single();
  if (error) throw error;
  return toShift(data);
}

/** The most recent move that can still be undone (not undone, newer than `since`). */
export async function latestUndoableShift(
  supabase: SupabaseClient,
  userId: string,
  since: Date,
): Promise<DateShift | null> {
  const { data, error } = await supabase
    .from("date_shifts")
    .select("*")
    .eq("user_id", userId)
    .is("undone_at", null)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toShift(data) : null;
}

export async function getShift(supabase: SupabaseClient, id: string): Promise<DateShift | null> {
  const { data, error } = await supabase.from("date_shifts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toShift(data) : null;
}

export async function markShiftUndone(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("date_shifts").update({ undone_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

/** Writes exact due/plan dates onto tasks (used to move forward, and to put the old dates back). */
export async function setTaskDates(
  supabase: SupabaseClient,
  updates: { taskId: string; dueAt: string | null; scheduledAt: string | null }[],
): Promise<void> {
  await Promise.all(
    updates.map(async (u) => {
      const { error } = await supabase
        .from("tasks")
        .update({ due_at: u.dueAt, scheduled_at: u.scheduledAt })
        .eq("id", u.taskId);
      if (error) throw error;
    }),
  );
}

export interface Note {
  id: string;
  body: string;
  createdAt: string;
}

export async function createNotes(supabase: SupabaseClient, userId: string, bodies: string[]): Promise<void> {
  if (bodies.length === 0) return;
  const { error } = await supabase.from("notes").insert(bodies.map((body) => ({ user_id: userId, body })));
  if (error) throw error;
}

export async function listNotes(supabase: SupabaseClient, userId: string, limit = 20): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, body, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((n) => ({ id: n.id, body: n.body, createdAt: n.created_at }));
}

export async function deleteNote(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
