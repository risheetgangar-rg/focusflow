import type { ParsedTaskItem } from "@/types/brain-dump";

/** A parsed task plus a stable key, so editing or removing one never confuses the others. */
export interface EditableItem extends ParsedTaskItem {
  key: string;
}

/** Matches the server's limit on a single brain dump. */
export const MAX_CHARS = 4000;

/** Things to try, written the way the parser understands: "and", new lines, days, times. */
export const EXAMPLES = [
  "Tomorrow call Rahul at 6 and finish presentation, and pay electricity bill Friday.",
  "Email Priya today and book dentist Monday and buy groceries tomorrow",
  "Study chemistry tomorrow at 7pm and clean my desk",
];

/** `batch` changes with every fresh parse, so keys from an earlier review can never collide. */
export function toEditable(items: ParsedTaskItem[], batch: number): EditableItem[] {
  return items.map((item, i) => ({ ...item, key: `${batch}-${i}` }));
}

/** Exactly what the server expects: the task fields, none of the screen's bookkeeping. */
export function toPayload(items: EditableItem[]): ParsedTaskItem[] {
  return items.map((item) => ({
    title: item.title.trim(),
    dueDate: item.dueDate || undefined,
    dueTime: item.dueTime || undefined,
    priority: item.priority,
    estimatedMinutes: item.estimatedMinutes,
  }));
}

export function hasBlankTitle(items: EditableItem[]): boolean {
  return items.some((item) => item.title.trim().length === 0);
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function taskCountLabel(count: number): string {
  return `${count} ${count === 1 ? "task" : "tasks"}`;
}
