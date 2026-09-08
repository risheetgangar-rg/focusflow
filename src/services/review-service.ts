import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "@/types/task";

function isSameLocalDate(iso: string, reference: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

export interface DailyStats {
  completedCount: number;
  rescheduledCount: number;
  remainingCount: number;
}

/**
 * Today's snapshot. "Rescheduled" approximates tasks that were pushed at
 * least once and are still pending — there's no separate reschedule-event
 * log, so this reads current state rather than "rescheduled specifically
 * today."
 */
export function computeDailyStats(tasks: Task[], now: Date = new Date()): DailyStats {
  const completedCount = tasks.filter(
    (t) => t.status === "completed" && t.completedAt && isSameLocalDate(t.completedAt, now),
  ).length;
  const pending = tasks.filter((t) => t.status === "pending");
  const rescheduledCount = pending.filter((t) => t.postponedCount > 0).length;

  return { completedCount, rescheduledCount, remainingCount: pending.length };
}

export interface WeeklyStats {
  focusSessionCount: number;
  importantCompletedCount: number;
}

export function computeWeeklyStats(
  tasks: Task[],
  focusSessionCount: number,
  weekStart: string,
  weekEnd: string,
): WeeklyStats {
  const importantCompletedCount = tasks.filter(
    (t) =>
      t.status === "completed" &&
      t.importance >= 4 &&
      t.completedAt &&
      t.completedAt.slice(0, 10) >= weekStart &&
      t.completedAt.slice(0, 10) <= weekEnd,
  ).length;

  return { focusSessionCount, importantCompletedCount };
}

export async function getReflection(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("daily_reviews")
    .select("reflection")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data?.reflection ?? null;
}

export async function saveReview(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  stats: DailyStats,
  reflection: string | null,
): Promise<void> {
  const { error } = await supabase.from("daily_reviews").upsert(
    {
      user_id: userId,
      date,
      completed_count: stats.completedCount,
      rescheduled_count: stats.rescheduledCount,
      remaining_count: stats.remainingCount,
      reflection,
    },
    { onConflict: "user_id,date" },
  );
  if (error) throw error;
}
