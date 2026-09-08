export type ReminderType =
  | "upcoming_task"
  | "deadline_approaching"
  | "habit_reminder"
  | "missed_task"
  | "reschedule_suggestion"
  | "rescue";

export type ReminderStatus = "pending" | "sent" | "dismissed" | "snoozed";

export interface Reminder {
  id: string;
  userId: string;
  taskId: string | null;
  habitId: string | null;
  reminderType: ReminderType;
  scheduledFor: string;
  status: ReminderStatus;
  notificationTitle: string;
  notificationBody: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderCandidate {
  taskId: string | null;
  habitId: string | null;
  reminderType: ReminderType;
  scheduledFor: string;
  title: string;
  body: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}

export interface NotificationPreferences {
  notifyTaskReminders: boolean;
  notifyHabitReminders: boolean;
  notifyDeadlineReminders: boolean;
  notifyRescueReminders: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}
