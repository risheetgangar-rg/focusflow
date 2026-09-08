export type TaskStatus = "pending" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskSource = "manual" | "brain_dump" | "voice" | "recurring";
export type RecurrenceRule = "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  importance: number;
  urgency: number;
  friction: number;
  estimatedMinutes: number | null;
  dueAt: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  parentTaskId: string | null;
  source: TaskSource;
  recurrenceRule: RecurrenceRule | null;
  startedAt: string | null;
  postponedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  userId: string;
  title: string;
  position: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  importance?: number;
  urgency?: number;
  friction?: number;
  estimatedMinutes?: number | null;
  dueAt?: string | null;
  scheduledAt?: string | null;
  recurrenceRule?: RecurrenceRule | null;
}
