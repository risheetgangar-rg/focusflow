"use client";

import { useActionState, useState } from "react";
import { Bell, ChevronDown, ListChecks } from "lucide-react";
import { saveTask, type TaskFormState } from "@/app/(dashboard)/tasks/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { useApp } from "@/components/providers/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillGroup } from "@/components/ui/pill-group";
import { Textarea } from "@/components/ui/textarea";
import { zonedDateString, zonedTimeString } from "@/lib/dates/tz";
import { TASK_TYPES } from "@/lib/tasks/personal";
import { cn } from "@/lib/utils";
import type { Task, TaskKind } from "@/types/task";
import { DurationDial } from "./duration-dial";

const RHYTHMS = [
  { value: "daily", label: "Every day" },
  { value: "thrice_weekly", label: "3× a week" },
  { value: "twice_weekly", label: "2× a week" },
  { value: "weekly", label: "Every week" },
];

export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

/**
 * Kept to what matters: what it is, task or reminder, when, how long (tasks
 * only), and one priority. Everything else is optional and tucked away.
 */
export function TaskForm({
  task,
  onSaved,
  defaultDueDate,
}: {
  task?: Task | null;
  onSaved?: () => void;
  /** Pre-fills the date (YYYY-MM-DD) for new tasks. */
  defaultDueDate?: string;
}) {
  const { timezone } = useApp();
  const { notify } = useCelebration();
  const editing = Boolean(task);

  const due = task?.dueAt ? new Date(task.dueAt) : null;
  const dueTime = due ? zonedTimeString(due, timezone) : "";
  const [kind, setKind] = useState<TaskKind>(task?.kind ?? "task");
  const [minutes, setMinutes] = useState<number | null>(task?.estimatedMinutes ?? null);
  const [showMore, setShowMore] = useState(Boolean(task?.description || (task?.kind === "reminder" && task.recurrenceRule)));
  const [routine, setRoutine] = useState(Boolean(task?.recurrenceRule && task.kind !== "reminder"));
  const [rhythm, setRhythm] = useState<string>(task?.recurrenceRule && task.recurrenceRule !== "monthly" ? task.recurrenceRule : "daily");
  const isReminder = kind === "reminder";
  const typeLabel = task && task.taskType !== "other" ? TASK_TYPES.find((t) => t.value === task.taskType)?.label : "";

  const [state, action, pending] = useActionState(
    async (prev: TaskFormState, formData: FormData) => {
      const result = await saveTask(task?.id ?? null, prev, formData);
      if (result.message) {
        notify({ title: editing ? "Changes saved" : isReminder ? "Reminder added" : "Task added", detail: String(formData.get("title") ?? "") });
        onSaved?.();
      }
      return result;
    },
    {} as TaskFormState,
  );

  return (
    <form action={action} className="space-y-6">
      <Input
        id="title"
        name="title"
        aria-label="Title"
        defaultValue={task?.title}
        placeholder={isReminder ? "What should we remind you about?" : "What do you want to get done?"}
        required
        autoFocus
        maxLength={200}
        className="h-14 rounded-2xl border-0 bg-muted px-5 font-display text-2xl shadow-none focus-visible:bg-card md:text-2xl"
      />

      {/* Task or reminder decides everything below it. */}
      <div className="grid grid-cols-2 gap-2">
        <input type="hidden" name="kind" value={kind} />
        {(["task", "reminder"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-3.5 text-left transition-colors",
              kind === k && "border-brand bg-brand-soft",
            )}
          >
            {k === "task" ? <ListChecks className="shrink-0 text-brand" /> : <Bell className="shrink-0 text-brand" />}
            <span>
              <span className="block font-semibold">{k === "task" ? "Task" : "Reminder"}</span>
              <span className="block text-xs text-muted-foreground">
                {k === "task" ? "Something you do. Has a timer." : "A nudge at a time. No timer."}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* A task is either a non-negotiable (on a rhythm) or new stuff (a one-off). */}
      {!isReminder && (
        <PillGroup
          name="lane"
          ariaLabel="What kind of task"
          value={routine ? "routine" : "fresh"}
          onValueChange={(v) => setRoutine(v === "routine")}
          options={[
            { value: "routine", label: "Non-negotiable" },
            { value: "fresh", label: "New stuff" },
          ]}
        />
      )}

      {routine && !isReminder ? (
        <div className="space-y-2">
          <Label>How often?</Label>
          <PillGroup name="recurrenceRule" ariaLabel="How often" value={rhythm} onValueChange={setRhythm} options={RHYTHMS} />
          {/* Keep the date of the current round when only the rhythm is edited. */}
          <input type="hidden" name="dueDate" value={due ? zonedDateString(due, timezone) : ""} />
          <input type="hidden" name="dueTime" value={dueTime} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dueDate">{isReminder ? "Remind me on" : "Do it by (optional)"}</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              required={isReminder}
              defaultValue={due ? zonedDateString(due, timezone) : (defaultDueDate ?? "")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueTime">{isReminder ? "At" : "At (optional)"}</Label>
            <Input id="dueTime" name="dueTime" type="time" required={isReminder} defaultValue={dueTime && dueTime !== "00:00" ? dueTime : ""} />
          </div>
          {!isReminder && <input type="hidden" name="recurrenceRule" value="none" />}
        </div>
      )}

      {!isReminder && (
        <div className="space-y-2">
          <Label>How long will it take?</Label>
          <DurationDial name="estimatedMinutes" value={minutes} onChange={setMinutes} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Priority</Label>
        <PillGroup name="priority" ariaLabel="Priority" defaultValue={task?.priority ?? "medium"} options={PRIORITIES} />
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        aria-expanded={showMore}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown size={16} className={cn("transition-transform", showMore && "rotate-180")} />
        {showMore ? "Less" : "More (optional)"}
      </button>

      {/* Always rendered (just hidden) so every field is submitted either way. */}
      <div className={cn("space-y-6", !showMore && "hidden")}>
        {!isReminder && (
          <div className="space-y-2">
            <Label htmlFor="kindText">What kind of task? (optional)</Label>
            <Input id="kindText" name="kindText" defaultValue={typeLabel} placeholder="Like bills, work, home…" maxLength={60} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="description">Notes (optional)</Label>
          <Textarea id="description" name="description" defaultValue={task?.description ?? ""} placeholder="Anything that will help future you" />
        </div>
        {isReminder && (
          <div className="space-y-2">
            <Label>Repeat</Label>
            <PillGroup
              name="recurrenceRule"
              ariaLabel="Repeat"
              defaultValue={task?.recurrenceRule ?? "none"}
              options={[
                { value: "none", label: "Never" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
          </div>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" variant="brand" disabled={pending} className="w-full">
        {pending ? "Saving…" : editing ? "Save changes" : isReminder ? "Add reminder" : "Add task"}
      </Button>
    </form>
  );
}
