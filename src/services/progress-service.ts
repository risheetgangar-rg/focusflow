import type { SupabaseClient } from "@supabase/supabase-js";
import type { History } from "@/lib/rewards/medals";

/** Everything the medals look at, straight from what's saved. Nothing extra is stored. */
export async function loadHistory(supabase: SupabaseClient, userId: string): Promise<History> {
  const [done, focus, shifts] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, completed_at, priority, kind, felt")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("completed_at", "is", null),
    supabase.from("focus_sessions").select("id, actual_minutes, completed").eq("user_id", userId).not("ended_at", "is", null),
    supabase.from("date_shifts").select("id", { count: "exact", head: true }).eq("user_id", userId).is("undone_at", null),
  ]);
  return {
    done: (done.data ?? []).map((d) => ({
      id: d.id as string,
      completedAt: d.completed_at as string,
      priority: (d.priority as string) ?? "medium",
      kind: (d.kind as string) ?? "task",
      felt: (d.felt as string | null) ?? null,
    })),
    focus: (focus.data ?? []).map((f) => ({
      id: f.id as string,
      minutes: (f.actual_minutes as number | null) ?? 0,
      completed: Boolean(f.completed),
    })),
    comebacks: shifts.count ?? 0,
  };
}
