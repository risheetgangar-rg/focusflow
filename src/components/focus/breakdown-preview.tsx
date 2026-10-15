"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_STEPS } from "@/lib/tasks/task-breaker";

/**
 * A suggested way to break the task into small steps. Every line is editable,
 * and nothing is saved until "Use these steps" is pressed.
 */
export function BreakdownPreview({
  steps,
  onChange,
  onSave,
  onDismiss,
  saving,
  error,
}: {
  steps: string[];
  onChange: (steps: string[]) => void;
  onSave: () => void;
  onDismiss: () => void;
  saving: boolean;
  error: string | null;
}) {
  const hasContent = steps.some((s) => s.trim());

  return (
    <div className="w-full max-w-xl space-y-4 rounded-3xl border border-brand/25 bg-card/85 p-5 text-left shadow-soft backdrop-blur sm:p-6">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand">
          <Sparkles size={16} /> A way to start. Edit anything.
        </p>
        <p className="text-sm text-muted-foreground">Small steps are easier to begin. Nothing is saved until you say so.</p>
      </div>

      <ol className="space-y-2" aria-label="Suggested steps">
        {steps.map((text, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand tabular-nums"
            >
              {i + 1}
            </span>
            <Input
              value={text}
              aria-label={`Step ${i + 1}`}
              maxLength={200}
              onChange={(e) => onChange(steps.map((s, j) => (j === i ? e.target.value : s)))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove step ${i + 1}`}
              onClick={() => onChange(steps.filter((_, j) => j !== i))}
            >
              <X />
            </Button>
          </li>
        ))}
      </ol>

      {steps.length < MAX_STEPS && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...steps, ""])}>
          <Plus /> Add a step
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="brand" size="lg" onClick={onSave} disabled={saving || !hasContent}>
          {saving ? "Saving…" : "Use these steps"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onDismiss} disabled={saving}>
          Not now
        </Button>
      </div>
    </div>
  );
}
