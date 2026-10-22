import type { ParsedTaskItem } from "@/types/brain-dump";

/** A parsed task plus a stable key, so editing or removing one never confuses the others. */
export type ItemChoice = "task" | "note" | "skip";

export interface EditableItem extends Omit<ParsedTaskItem, "kind"> {
  key: string;
  /** What to do with it: save as a task, keep as a note, or leave it out. */
  choice: ItemChoice;
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
  return items.map(({ kind, ...item }, i) => ({ ...item, choice: kind === "note" ? "note" : "task", key: `${batch}-${i}` }));
}

/** Exactly what the server expects: the task fields, none of the screen's bookkeeping. */
export function toPayload(items: EditableItem[]): ParsedTaskItem[] {
  return items
    .filter((item) => item.choice !== "skip")
    .map((item) => ({
      title: item.title.trim(),
      kind: item.choice === "note" ? "note" : "task",
      dueDate: item.choice === "task" ? item.dueDate || undefined : undefined,
      dueTime: item.choice === "task" && item.dueDate ? item.dueTime || undefined : undefined,
      priority: item.priority,
      estimatedMinutes: item.estimatedMinutes,
      firstStep: item.choice === "task" ? item.firstStep : undefined,
    }));
}

export function hasBlankTitle(items: EditableItem[]): boolean {
  return items.some((item) => item.choice !== "skip" && item.title.trim().length === 0);
}

/** "3 tasks and 1 note", for the Save button and the done screen. */
export function saveLabel(items: EditableItem[]): string {
  const tasks = items.filter((i) => i.choice === "task").length;
  const notes = items.filter((i) => i.choice === "note").length;
  const parts = [tasks ? taskCountLabel(tasks) : "", notes ? `${notes} ${notes === 1 ? "note" : "notes"}` : ""].filter(Boolean);
  return parts.join(" and ") || "nothing";
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function taskCountLabel(count: number): string {
  return `${count} ${count === 1 ? "task" : "tasks"}`;
}
