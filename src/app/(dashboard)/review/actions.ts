"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import { computeDailyStats, saveReview } from "@/services/review-service";
import { todayDateString } from "@/services/habit-service";

export interface ReviewState {
  error?: string;
  message?: string;
}

export async function saveReflectionAction(
  _prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase isn't connected yet — this is a local demo." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const reflection = String(formData.get("reflection") || "").trim();
  const now = new Date();
  const tasks = await taskRepo.listTasks(supabase, user.id);
  const stats = computeDailyStats(tasks, now);

  await saveReview(supabase, user.id, todayDateString(now), stats, reflection || null);
  revalidatePath("/review");
  return { message: "Saved." };
}
