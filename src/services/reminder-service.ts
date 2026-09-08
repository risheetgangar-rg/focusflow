import type { Habit } from "@/types/habit";
import type { NotificationPreferences, ReminderCandidate } from "@/types/reminder";
import type { Task } from "@/types/task";

export function isWithinQuietHours(now: Date, prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

  const [startH, startM] = prefs.quietHoursStart.split(":").map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(":").map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  return nowMinutes >= startMinutes || nowMinutes < endMinutes; // wraps past midnight
}

/**
 * Deterministic reminder candidates from current task/habit state — no AI,
 * no invented deadlines. Callers de-duplicate against the reminders table
 * before sending (see the partial unique indexes in the migration).
 */
export function generateTaskReminders(
  tasks: Task[],
  now: Date,
  prefs: NotificationPreferences,
): ReminderCandidate[] {
  const candidates: ReminderCandidate[] = [];

  for (const task of tasks) {
    if (task.status !== "pending" || !task.dueAt) continue;
    const minutesUntil = (new Date(task.dueAt).getTime() - now.getTime()) / 60_000;

    if (prefs.notifyTaskReminders && minutesUntil > 0 && minutesUntil <= 15) {
      candidates.push({
        taskId: task.id,
        habitId: null,
        reminderType: "upcoming_task",
        scheduledFor: now.toISOString(),
        title: task.title,
        body: `Starts in ${Math.max(1, Math.round(minutesUntil))} minutes.`,
      });
    } else if (prefs.notifyDeadlineReminders && minutesUntil > 15 && minutesUntil <= 60) {
      candidates.push({
        taskId: task.id,
        habitId: null,
        reminderType: "deadline_approaching",
        scheduledFor: now.toISOString(),
        title: task.title,
        body: "Due in about an hour.",
      });
    } else if (prefs.notifyTaskReminders && minutesUntil < 0 && minutesUntil > -24 * 60) {
      candidates.push({
        taskId: task.id,
        habitId: null,
        reminderType: "missed_task",
        scheduledFor: now.toISOString(),
        title: task.title,
        body: "Looks like this didn't happen. Move it?",
      });
    }
  }

  return candidates;
}

export function generateHabitReminders(
  habits: Habit[],
  now: Date,
  prefs: NotificationPreferences,
  windowMinutes = 15,
): ReminderCandidate[] {
  if (!prefs.notifyHabitReminders) return [];

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const candidates: ReminderCandidate[] = [];

  for (const habit of habits) {
    if (!habit.active || !habit.reminderEnabled || !habit.reminderTime) continue;
    const [h, m] = habit.reminderTime.split(":").map(Number);
    const reminderMinutes = h * 60 + m;
    if (reminderMinutes >= nowMinutes && reminderMinutes < nowMinutes + windowMinutes) {
      candidates.push({
        taskId: null,
        habitId: habit.id,
        reminderType: "habit_reminder",
        scheduledFor: now.toISOString(),
        title: habit.name,
        body: "Ready to give this 5 minutes?",
      });
    }
  }

  return candidates;
}
