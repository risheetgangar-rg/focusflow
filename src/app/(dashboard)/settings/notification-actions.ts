"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import * as reminderRepo from "@/repositories/reminder-repository";

export interface NotificationPrefsState {
  error?: string;
  message?: string;
}

export async function updateNotificationPrefsAction(
  _prevState: NotificationPrefsState,
  formData: FormData,
): Promise<NotificationPrefsState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  const quietHoursStart = String(formData.get("quietHoursStart") || "");
  const quietHoursEnd = String(formData.get("quietHoursEnd") || "");

  await reminderRepo.updatePreferences(session.supabase, session.userId, {
    notifyTaskReminders: formData.get("notifyTaskReminders") === "on",
    notifyHabitReminders: formData.get("notifyHabitReminders") === "on",
    notifyDeadlineReminders: formData.get("notifyDeadlineReminders") === "on",
    notifyRescueReminders: formData.get("notifyRescueReminders") === "on",
    quietHoursStart: quietHoursStart || null,
    quietHoursEnd: quietHoursEnd || null,
  });

  revalidatePath("/settings");
  return { message: "Saved." };
}
