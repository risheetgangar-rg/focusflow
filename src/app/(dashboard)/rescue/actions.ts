"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { XP_AMOUNTS } from "@/lib/gamification/rules";
import { track } from "@/services/analytics-service";
import { EMPTY_OUTCOME } from "@/services/completion-service";
import { awardXp } from "@/services/gamification-service";
import { todayDateString } from "@/services/habit-service";
import * as taskService from "@/services/task-service";
import type { RescheduleTarget } from "@/services/task-service";
import type { CompletionOutcome } from "@/types/gamification";

/** Moves everything outside the recovery set. Rewards the decluttering itself, once a day. */
export async function rescheduleRestAction(
  taskIds: string[],
  target: RescheduleTarget,
): Promise<CompletionOutcome> {
  const session = await getSession();
  if (!session) return EMPTY_OUTCOME;
  const { supabase, userId, timezone, profile } = session;

  const date = taskService.resolveRescheduleDate(target, undefined, timezone);
  await Promise.all(taskIds.map((taskId) => taskService.moveTask(supabase, taskId, date)));
  await track(supabase, userId, "rescue_completed", { moved: taskIds.length, target });

  let outcome = EMPTY_OUTCOME;
  if (profile.gamificationMode !== "off") {
    const reward = await awardXp(supabase, userId, {
      type: "rescue_action",
      sourceId: todayDateString(new Date(), timezone),
      xp: XP_AMOUNTS.RESCUE_ACTION,
      timezone,
      achievements: profile.gamificationMode === "full",
    });
    outcome = { ...EMPTY_OUTCOME, reward };
  }

  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/rescue");
  return outcome;
}
