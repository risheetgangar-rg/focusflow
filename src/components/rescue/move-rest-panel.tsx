"use client";

import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOVE_CHOICES, useMoveTasks } from "./use-move-tasks";

/**
 * "Everything else": deliberately quieter than the three-task plan above it.
 * One decision, no pressure, and nothing is deleted.
 */
export function MoveRestPanel({ taskIds }: { taskIds: string[] }) {
  const { count, noun, pending, choice, move, movedWhen } = useMoveTasks(taskIds);

  if (count === 0) return null;

  if (movedWhen) {
    return (
      <section role="status" className="flex items-start gap-3 rounded-3xl bg-tint-mint p-5 sm:p-6">
        <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="text-foreground/85">
          <span className="font-medium">All set.</span> The other {count} {noun} will wait for you {movedWhen}.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="rest-heading"
      className="rounded-3xl border border-dashed border-border bg-surface/60 p-5 sm:p-6"
    >
      <p id="rest-heading" className="text-eyebrow">
        Everything else
      </p>
      <p className="mt-2 text-lg text-foreground/85">
        Move the other {count} to&hellip;
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {MOVE_CHOICES.map((item) => (
          <Button key={item.target} variant="outline" disabled={pending} onClick={() => move(item)}>
            {pending && choice === item.target ? "Moving…" : item.label}
          </Button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">They&apos;ll wait for you. Nothing is deleted.</p>
    </section>
  );
}
