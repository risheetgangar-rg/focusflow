import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TIMEZONE, zonedDateString } from "@/lib/dates/tz";
import type { Task } from "@/types/task";

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
export function computeDailyStats(
  tasks: Task[],
  now: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE,
): DailyStats {
  const today = zonedDateString(now, timezone);
  const completedCount = tasks.filter(
    (t) =>
      t.status === "completed" &&
      t.completedAt &&
      zonedDateString(new Date(t.completedAt), timezone) === today,
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
  timezone: string = DEFAULT_TIMEZONE,
): WeeklyStats {
  const importantCompletedCount = tasks.filter((t) => {
    if (t.status !== "completed" || t.importance < 4 || !t.completedAt) return false;
    const day = zonedDateString(new Date(t.completedAt), timezone);
    return day >= weekStart && day <= weekEnd;
  }).length;

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
