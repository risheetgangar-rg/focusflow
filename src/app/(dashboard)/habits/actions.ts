"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { habitFormSchema } from "@/lib/validation/habit";
import * as habitRepo from "@/repositories/habit-repository";
import { todayDateString } from "@/services/habit-service";
import type { HabitCompletionStatus } from "@/types/habit";

export interface HabitFormState {
  error?: string;
  message?: string;
}

const NOT_CONFIGURED = "Supabase isn't connected yet — this is a local demo.";

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, userId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { error: NOT_CONFIGURED };

  const { name, description, color, targetCount } = parsed.data;
  if (habitId) {
    await habitRepo.updateHabit(supabase, habitId, {
      name,
      description: description || null,
      color,
      targetCount,
    });
  } else {
    await habitRepo.createHabit(supabase, userId, {
      name,
      description: description || null,
      color,
      targetCount,
    });
  }

  refresh();
  return { message: "Saved." };
}

export async function archiveHabitAction(habitId: string) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await habitRepo.archiveHabit(supabase, habitId);
  refresh();
}

export async function setHabitCompletionAction(
  habitId: string,
  date: string,
  status: HabitCompletionStatus,
) {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return;
  await habitRepo.setCompletion(supabase, userId, habitId, date, status);
  refresh();
}

export async function clearHabitCompletionAction(habitId: string, date: string) {
  const { supabase } = await requireUser();
  if (!supabase) return;
  await habitRepo.clearCompletion(supabase, habitId, date);
  refresh();
}

export async function markHabitTodayAction(habitId: string, status: HabitCompletionStatus) {
  return setHabitCompletionAction(habitId, todayDateString(), status);
}
