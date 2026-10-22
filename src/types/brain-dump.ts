import type { TaskPriority } from "@/types/task";

export interface ParsedTaskItem {
  title: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority?: TaskPriority;
  estimatedMinutes?: number;
  /** "note" is kept as a note, not a task. Defaults to task. */
  kind?: "task" | "note";
  /** A tiny first step (under 2 minutes), when the AI reader wrote one. */
  firstStep?: string;
}

export interface ParsedBrainDump {
  items: ParsedTaskItem[];
}
