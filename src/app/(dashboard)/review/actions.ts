"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import * as taskRepo from "@/repositories/task-repository";
import { todayDateString } from "@/services/habit-service";
import { computeDailyStats, saveReview } from "@/services/review-service";

export interface ReviewState {
  error?: string;
  message?: string;
}

export async function saveReflectionAction(
  _prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  const reflection = String(formData.get("reflection") || "").trim();
  const now = new Date();
  const tasks = await taskRepo.listTasks(session.supabase, session.userId);
  const stats = computeDailyStats(tasks, now, session.timezone);

  await saveReview(
    session.supabase,
    session.userId,
    todayDateString(now, session.timezone),
    stats,
    reflection || null,
  );
  revalidatePath("/review");
  return { message: "Saved." };
}
