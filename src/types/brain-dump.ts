import type { TaskPriority } from "@/types/task";

export interface ParsedTaskItem {
  title: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority?: TaskPriority;
  estimatedMinutes?: number;
}

export interface ParsedBrainDump {
  items: ParsedTaskItem[];
}
