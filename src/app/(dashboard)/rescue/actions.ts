"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import * as taskService from "@/services/task-service";
import type { RescheduleTarget } from "@/services/task-service";
import * as gamificationService from "@/services/gamification-service";
import { todayDateString } from "@/services/habit-service";

export async function rescheduleRestAction(taskIds: string[], target: RescheduleTarget) {
  const supabase = await createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const date = taskService.resolveRescheduleDate(target);
  for (const taskId of taskIds) {
    await taskRepo.rescheduleTask(supabase, taskId, date.toISOString());
  }

  await gamificationService.awardXp(
    supabase,
    user.id,
    "rescue_action",
    todayDateString(),
    gamificationService.XP_AMOUNTS.RESCUE_ACTION,
  );

  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/rescue");
}
