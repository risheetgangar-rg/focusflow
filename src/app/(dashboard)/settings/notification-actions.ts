"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as reminderRepo from "@/repositories/reminder-repository";

export interface NotificationPrefsState {
  error?: string;
  message?: string;
}

export async function updateNotificationPrefsAction(
  _prevState: NotificationPrefsState,
  formData: FormData,
): Promise<NotificationPrefsState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase isn't connected yet — this is a local demo." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const quietHoursStart = String(formData.get("quietHoursStart") || "");
  const quietHoursEnd = String(formData.get("quietHoursEnd") || "");

  await reminderRepo.updatePreferences(supabase, user.id, {
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
