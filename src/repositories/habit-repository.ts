import type { SupabaseClient } from "@supabase/supabase-js";
import type { Habit, HabitCompletion, HabitCompletionStatus } from "@/types/habit";

interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  target_count: number;
  target_period: string;
  reminder_enabled: boolean;
  reminder_time: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface HabitCompletionRow {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  status: string;
  created_at: string;
}

function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    color: row.color,
    targetCount: row.target_count,
    targetPeriod: "week",
    reminderEnabled: row.reminder_enabled,
    reminderTime: row.reminder_time,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCompletion(row: HabitCompletionRow): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habit_id,
    userId: row.user_id,
    date: row.date,
    status: row.status as HabitCompletionStatus,
    createdAt: row.created_at,
  };
}

export async function listHabits(supabase: SupabaseClient, userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as HabitRow[]).map(toHabit);
}

export async function createHabit(
  supabase: SupabaseClient,
  userId: string,
  input: { name: string; description?: string | null; color: string; targetCount: number },
): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      color: input.color,
      target_count: input.targetCount,
    })
    .select("*")
    .single();

  if (error) throw error;
  return toHabit(data);
}

export async function updateHabit(
  supabase: SupabaseClient,
  habitId: string,
  updates: Partial<{ name: string; description: string | null; color: string; targetCount: number }>,
): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.targetCount !== undefined && { target_count: updates.targetCount }),
    })
    .eq("id", habitId)
    .select("*")
    .single();

  if (error) throw error;
  return toHabit(data);
}

export async function archiveHabit(supabase: SupabaseClient, habitId: string): Promise<void> {
  const { error } = await supabase.from("habits").update({ active: false }).eq("id", habitId);
  if (error) throw error;
}

export async function listCompletionsInRange(
  supabase: SupabaseClient,
  habitIds: string[],
  fromDate: string,
  toDate: string,
): Promise<HabitCompletion[]> {
  if (habitIds.length === 0) return [];
  const { data, error } = await supabase
    .from("habit_completions")
    .select("*")
    .in("habit_id", habitIds)
    .gte("date", fromDate)
    .lte("date", toDate);

  if (error) throw error;
  return (data as HabitCompletionRow[]).map(toCompletion);
}

export async function setCompletion(
  supabase: SupabaseClient,
  userId: string,
  habitId: string,
  date: string,
  status: HabitCompletionStatus,
): Promise<HabitCompletion> {
  const { data, error } = await supabase
    .from("habit_completions")
    .upsert(
      { user_id: userId, habit_id: habitId, date, status },
      { onConflict: "habit_id,date" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return toCompletion(data);
}

export async function clearCompletion(
  supabase: SupabaseClient,
  habitId: string,
  date: string,
): Promise<void> {
  const { error } = await supabase
    .from("habit_completions")
    .delete()
    .eq("habit_id", habitId)
    .eq("date", date);
  if (error) throw error;
}
