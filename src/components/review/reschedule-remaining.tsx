"use client";

import { CircleCheck, Sparkles } from "lucide-react";
import { MOVE_CHOICES, useMoveTasks } from "@/components/rescue/use-move-tasks";
import { Button } from "@/components/ui/button";

/** "What should happen with what's left?" Three kind answers, one tap each. */
export function RescheduleRemaining({ taskIds }: { taskIds: string[] }) {
  const { count, noun, pending, choice, move, movedWhen } = useMoveTasks(taskIds);

  if (count === 0) {
    return (
      <div className="flex items-start gap-4 rounded-[2rem] bg-tint-mint p-6 sm:p-8">
        <Sparkles className="mt-1 size-5 shrink-0" aria-hidden />
        <div>
          <h2 className="font-display text-3xl">You&apos;re clear for now.</h2>
          <p className="mt-1 text-foreground/75">Nothing is waiting on you tonight. Enjoy the quiet.</p>
        </div>
      </div>
    );
  }

  if (movedWhen) {
    return (
      <div role="status" className="flex items-start gap-4 rounded-[2rem] bg-tint-mint p-6 sm:p-8">
        <CircleCheck className="mt-1 size-5 shrink-0" aria-hidden />
        <div>
          <h2 className="font-display text-3xl">All set.</h2>
          <p className="mt-1 text-foreground/75">
            {count} {noun} will wait for you {movedWhen}. Nothing to carry tonight.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="left-heading"
      className="rounded-[2rem] border border-border/80 bg-card p-6 shadow-soft sm:p-8"
    >
      <h2 id="left-heading" className="font-display text-3xl">
        What should happen with what&apos;s left?
      </h2>
      <p className="mt-2 text-muted-foreground">
        {count} {noun} still open. Pick a spot for {count === 1 ? "it" : "them"}, and let tonight go.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
        {MOVE_CHOICES.map((item) => (
          <Button
            key={item.target}
            variant="outline"
            disabled={pending}
            onClick={() => move(item)}
            className="h-auto min-h-16 flex-col gap-0.5 rounded-2xl px-2 py-3"
          >
            <span className="text-sm font-semibold">{pending && choice === item.target ? "Moving…" : item.label}</span>
            <span className="text-xs font-normal text-muted-foreground">{item.hint}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
