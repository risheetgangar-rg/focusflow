"use client";

import { Trash2 } from "lucide-react";
import type { EditableItem, ItemChoice } from "@/components/brain-dump/brain-dump-items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillGroup } from "@/components/ui/pill-group";
import type { ParsedTaskItem } from "@/types/brain-dump";

const CHOICES = [
  { value: "task", label: "Task" },
  { value: "note", label: "Note" },
  { value: "skip", label: "Skip" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

/** One parsed task, fully editable before anything is saved. */
export function ReviewCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: EditableItem;
  index: number;
  onChange: (patch: Partial<EditableItem>) => void;
  onRemove: () => void;
}) {
  const n = index + 1;
  return (
    <li className={cn("rounded-3xl border border-border bg-card p-4 shadow-soft transition-opacity sm:p-5", item.choice === "skip" && "opacity-55")}>
      <div className="flex items-start gap-3">
        <span className="mt-2.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
          {n}
        </span>

        <div className="min-w-0 flex-1 space-y-3">
          <PillGroup
            name={`choice-${item.key}`}
            ariaLabel={`Keep item ${n} as`}
            options={CHOICES}
            value={item.choice}
            onValueChange={(value) => onChange({ choice: value as ItemChoice })}
            optionClassName="h-8 px-3.5 text-xs"
          />
          <Input
            value={item.title}
            onChange={(e) => onChange({ title: e.target.value })}
            aria-label={`Task ${n} title`}
            maxLength={200}
            className="h-12 text-base font-medium"
          />

          {item.choice === "task" && (
          <>
          {item.firstStep && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">First step:</span> {item.firstStep}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={item.dueDate ?? ""}
              onChange={(e) => onChange({ dueDate: e.target.value || undefined })}
              aria-label={`Task ${n} due date`}
              className="h-10 w-auto min-w-40"
            />
            <Input
              type="time"
              value={item.dueTime ?? ""}
              onChange={(e) => onChange({ dueTime: e.target.value || undefined })}
              aria-label={`Task ${n} due time`}
              disabled={!item.dueDate}
              className="h-10 w-auto min-w-32"
            />
          </div>

          <PillGroup
            name={`priority-${item.key}`}
            ariaLabel={`Task ${n} priority`}
            options={PRIORITIES}
            value={item.priority ?? "medium"}
            onValueChange={(value) => onChange({ priority: value as ParsedTaskItem["priority"] })}
            optionClassName="h-8 px-3.5 text-xs"
          />
          </>
          )}
        </div>

        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove task ${n}`}>
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
