"use client";

import { useActionState, useState } from "react";
import { ChevronDown, Swords } from "lucide-react";
import { saveTask, type TaskFormState } from "@/app/(dashboard)/tasks/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { useApp } from "@/components/providers/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillGroup } from "@/components/ui/pill-group";
import { Textarea } from "@/components/ui/textarea";
import { zonedDateString, zonedTimeString } from "@/lib/dates/tz";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

const MINUTE_CHIPS = [5, 10, 15, 25, 45, 60];

function Rating({
  name,
  label,
  low,
  high,
  defaultValue,
}: {
  name: string;
  label: string;
  low: string;
  high: string;
  defaultValue: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <PillGroup
        name={name}
        ariaLabel={label}
        defaultValue={String(defaultValue)}
        options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: n }))}
        optionClassName="h-9 w-9 px-0"
      />
      <div className="flex justify-between text-[0.7rem] text-muted-foreground" style={{ maxWidth: "13.5rem" }}>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function TaskForm({
  task,
  onSaved,
  defaultDueDate,
}: {
  task?: Task | null;
  onSaved?: () => void;
  /** Pre-fills the due date (YYYY-MM-DD) for new tasks. */
  defaultDueDate?: string;
}) {
  const { timezone, mode } = useApp();
  const { notify } = useCelebration();
  const editing = Boolean(task);

  const due = task?.dueAt ? new Date(task.dueAt) : null;
  const scheduled = task?.scheduledAt ? new Date(task.scheduledAt) : null;
  const dueTime = due ? zonedTimeString(due, timezone) : "";

  const hasAdvanced = Boolean(
    task &&
      (task.description ||
        task.priority !== "medium" ||
        task.importance !== 3 ||
        task.urgency !== 3 ||
        task.friction !== 1 ||
        task.recurrenceRule ||
        task.isBoss ||
        scheduled),
  );
  const [showMore, setShowMore] = useState(hasAdvanced);
  const [minutes, setMinutes] = useState(task?.estimatedMinutes ? String(task.estimatedMinutes) : "");

  const [state, action, pending] = useActionState(
    async (prev: TaskFormState, formData: FormData) => {
      const result = await saveTask(task?.id ?? null, prev, formData);
      if (result.message) {
        notify({ title: editing ? "Changes saved" : "Task added", detail: String(formData.get("title") ?? "") });
        onSaved?.();
      }
      return result;
    },
    {} as TaskFormState,
  );

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="sr-only">
          Title
        </Label>
        <Input
          id="title"
          name="title"
          defaultValue={task?.title}
          placeholder="What do you want to get done?"
          required
          autoFocus
          maxLength={200}
          className="h-14 rounded-2xl border-0 bg-muted px-5 font-display text-2xl shadow-none focus-visible:bg-card md:text-2xl"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={due ? zonedDateString(due, timezone) : (defaultDueDate ?? "")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueTime">At (optional)</Label>
          <Input
            id="dueTime"
            name="dueTime"
            type="time"
            defaultValue={dueTime && dueTime !== "00:00" ? dueTime : ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minutes">How long will it take?</Label>
        <input type="hidden" name="estimatedMinutes" value={minutes} />
        <div className="flex flex-wrap items-center gap-2">
          {MINUTE_CHIPS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMinutes(minutes === String(n) ? "" : String(n))}
              aria-pressed={minutes === String(n)}
              className={cn(
                "h-9 rounded-full border border-input bg-card px-3.5 text-sm font-medium text-foreground/80 transition-all hover:border-foreground/30",
                minutes === String(n) && "border-primary bg-primary text-primary-foreground hover:border-primary",
              )}
            >
              {n} min
            </button>
          ))}
          <Input
            id="minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Other"
            className="h-9 w-24 rounded-full px-4 text-sm"
            aria-label="Minutes (custom)"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        aria-expanded={showMore}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown size={16} className={cn("transition-transform", showMore && "rotate-180")} />
        {showMore ? "Fewer options" : "More options"}
      </button>

      {/* Always rendered (just hidden) so every field is submitted whichever way it's collapsed. */}
      <div className={cn("space-y-6", !showMore && "hidden")}>
        <div className="space-y-2">
          <Label htmlFor="description">Notes</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={task?.description ?? ""}
            placeholder="Anything that will help future you"
          />
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <PillGroup
            name="priority"
            ariaLabel="Priority"
            defaultValue={task?.priority ?? "medium"}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ]}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Rating name="importance" label="How much it matters" low="A little" high="A lot" defaultValue={task?.importance ?? 3} />
          <Rating name="urgency" label="How soon" low="Whenever" high="Now" defaultValue={task?.urgency ?? 3} />
          <Rating name="friction" label="How hard to start" low="Easy" high="Ugh" defaultValue={task?.friction ?? 1} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Plan to do it on</Label>
            <Input
              id="scheduledDate"
              name="scheduledDate"
              type="date"
              defaultValue={scheduled ? zonedDateString(scheduled, timezone) : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledTime">At</Label>
            <Input
              id="scheduledTime"
              name="scheduledTime"
              type="time"
              defaultValue={scheduled ? zonedTimeString(scheduled, timezone) : ""}
            />
          </div>
        </div>

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

        {mode === "full" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-input bg-card p-4 transition-colors hover:border-foreground/30 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
            <input type="checkbox" name="isBoss" defaultChecked={task?.isBoss} className="peer mt-1 size-4 accent-[var(--brand)]" />
            <span className="space-y-0.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Swords size={15} /> Make it a Boss Task
              </span>
              <span className="block text-sm text-muted-foreground">
                For something big and intimidating. Break it into steps and watch its HP drop as you finish each one.
              </span>
            </span>
          </label>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" variant="brand" disabled={pending} className="w-full">
        {pending ? "Saving…" : editing ? "Save changes" : "Add task"}
      </Button>
    </form>
  );
}
