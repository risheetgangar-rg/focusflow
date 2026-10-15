import { getTaskParser } from "@/lib/ai/task-parser";
import { describeDue } from "@/lib/dates/format";
import { zonedTimeToUtc } from "@/lib/dates/tz";
import type { ParsedTaskItem } from "@/types/brain-dump";

/** A first task is a gentle start; a long list belongs in the brain dump. */
export const MAX_FIRST_TASKS = 5;

export interface PreviewTask {
  title: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority?: ParsedTaskItem["priority"];
}

export interface PreviewItem {
  /** Exactly what will be saved. */
  task: PreviewTask;
  /** Plain-language labels for the live preview, e.g. "Tomorrow · 6:00 PM". */
  dueLabel: string | null;
  priorityLabel: string | null;
  /** Stable identity, so a retry never saves the same thing twice. */
  key: string;
}

export interface FirstTaskPreview {
  items: PreviewItem[];
  /** How many more things were found beyond MAX_FIRST_TASKS. */
  overflow: number;
}

function localDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function priorityLabel(priority: PreviewTask["priority"]): string | null {
  if (priority === "critical") return "Urgent";
  if (priority === "high") return "Important";
  return null;
}

/**
 * What the first-task box understands from what was typed. Pure and instant, so the preview can
 * update on every keystroke and what you see is exactly what gets saved. `tz` is the timezone
 * the date and time are read in (the browser's, for a brand-new account).
 */
export function previewFirstTasks(text: string, now: Date, tz: string): FirstTaskPreview {
  const trimmed = text.trim();
  if (!trimmed) return { items: [], overflow: 0 };

  const parsed = getTaskParser().parse(trimmed, now);
  const items = parsed.slice(0, MAX_FIRST_TASKS).map((item): PreviewItem => {
    // A time with no day ("call mum at 6") means today, and we say so rather than quietly dropping it.
    const dueDate = item.dueDate ?? (item.dueTime ? localDateString(now) : undefined);
    const task: PreviewTask = {
      title: item.title,
      ...(dueDate ? { dueDate } : {}),
      ...(dueDate && item.dueTime ? { dueTime: item.dueTime } : {}),
      ...(item.priority ? { priority: item.priority } : {}),
    };
    const dueLabel = dueDate
      ? describeDue(zonedTimeToUtc(dueDate, task.dueTime, tz).toISOString(), now, tz).label
      : null;

    return {
      task,
      dueLabel,
      priorityLabel: priorityLabel(task.priority),
      key: `${task.title}|${task.dueDate ?? ""}|${task.dueTime ?? ""}`,
    };
  });

  return { items, overflow: Math.max(0, parsed.length - MAX_FIRST_TASKS) };
}
