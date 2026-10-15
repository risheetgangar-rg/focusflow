"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { XP_AMOUNTS } from "@/lib/gamification/rules";
import { habitFormSchema } from "@/lib/validation/habit";
import * as habitRepo from "@/repositories/habit-repository";
import { track } from "@/services/analytics-service";
import { awardXp } from "@/services/gamification-service";
import { EMPTY_OUTCOME } from "@/services/completion-service";
import type { CompletionOutcome } from "@/types/gamification";
import type { HabitCompletionStatus } from "@/types/habit";

export interface HabitFormState {
  error?: string;
  message?: string;
}

function refresh() {
  revalidatePath("/habits");
  revalidatePath("/today");
}

export async function saveHabit(
  habitId: string | null,
  _prevState: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const parsed = habitFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Something looks off. Check the form." };
  }

  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  const { name, description, color, targetCount, reminderEnabled, reminderTime } = parsed.data;
  const fields = {
    name,
    description: description || null,
    color,
    targetCount,
    reminderEnabled: reminderEnabled && Boolean(reminderTime),
    reminderTime: reminderTime || null,
  };

  if (habitId) {
    await habitRepo.updateHabit(session.supabase, habitId, fields);
  } else {
    await habitRepo.createHabit(session.supabase, session.userId, fields);
  }

  refresh();
  return { message: "Saved." };
}

export async function archiveHabitAction(habitId: string) {
  const session = await getSession();
  if (!session) return;
  await habitRepo.archiveHabit(session.supabase, habitId);
  refresh();
}

export async function setHabitCompletionAction(
  habitId: string,
  date: string,
  status: HabitCompletionStatus,
): Promise<CompletionOutcome> {
  const session = await getSession();
  if (!session) return EMPTY_OUTCOME;
  const { supabase, userId, timezone, profile } = session;

  await habitRepo.setCompletion(supabase, userId, habitId, date, status);
  refresh();

  if (status === "skipped" || profile.gamificationMode === "off") return EMPTY_OUTCOME;

  await track(supabase, userId, "habit_completed", { habit_id: habitId, status });
  const reward = await awardXp(supabase, userId, {
    type: "habit_completed",
    sourceId: `${habitId}:${date}`,
    xp: XP_AMOUNTS.HABIT_COMPLETED,
    timezone,
    achievements: profile.gamificationMode === "full",
  });
  return { ...EMPTY_OUTCOME, reward };
}

export async function clearHabitCompletionAction(habitId: string, date: string) {
  const session = await getSession();
  if (!session) return;
  await habitRepo.clearCompletion(session.supabase, habitId, date);
  refresh();
}
