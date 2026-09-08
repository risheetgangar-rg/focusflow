export type HabitCompletionStatus = "completed" | "partial" | "skipped";

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  targetCount: number;
  targetPeriod: "week";
  reminderEnabled: boolean;
  reminderTime: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  status: HabitCompletionStatus;
  createdAt: string;
}
