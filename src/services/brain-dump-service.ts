import type { SupabaseClient } from "@supabase/supabase-js";
import { zonedTimeToUtc } from "@/lib/dates/tz";
import * as taskRepo from "@/repositories/task-repository";
import type { ParsedTaskItem } from "@/types/brain-dump";

export async function recordBrainDump(
  supabase: SupabaseClient,
  userId: string,
  rawText: string,
  source: "text" | "voice",
  items: ParsedTaskItem[],
): Promise<void> {
  const { error } = await supabase.from("brain_dumps").insert({
    user_id: userId,
    raw_text: rawText,
    source,
    parsed_data: { items },
  });
  if (error) throw error;
}

/** Dates and times in the preview are wall-clock values in the user's timezone. */
export async function createTasksFromItems(
  supabase: SupabaseClient,
  userId: string,
  items: ParsedTaskItem[],
  source: "brain_dump" | "voice",
  timezone: string,
): Promise<number> {
  for (const item of items) {
    await taskRepo.createTask(supabase, userId, {
      title: item.title,
      priority: item.priority ?? "medium",
      dueAt: item.dueDate ? zonedTimeToUtc(item.dueDate, item.dueTime, timezone).toISOString() : null,
      estimatedMinutes: item.estimatedMinutes ?? null,
      source,
    });
  }
  return items.length;
}
