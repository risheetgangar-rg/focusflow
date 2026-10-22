"use client";

import { useEffect, useState } from "react";
import { ProgressRing } from "@/components/motion/progress-ring";

/** Fired by a task's checkbox: +1 when ticked, -1 when unticked. */
export const TASK_DONE_EVENT = "unstuck:task-done";

export function announceTaskDone(delta: 1 | -1) {
  window.dispatchEvent(new CustomEvent(TASK_DONE_EVENT, { detail: delta }));
}

function note(done: number, remaining: number) {
  if (done === 0) return remaining === 0 ? "A quiet start." : "A fresh start.";
  if (remaining === 0) return "All clear. Nice work.";
  if (done < 3) return "Good start.";
  return "You're rolling.";
}

/**
 * Today's ring: done vs. still on the plate. It moves the instant a task is
 * ticked, then settles on the server's numbers once the page refreshes.
 */
export function TodayProgress({ done, remaining }: { done: number; remaining: number }) {
  const [delta, setDelta] = useState(0);
  // New numbers from the server already include the ticks, so start counting from zero again.
  const [seen, setSeen] = useState({ done, remaining });
  if (seen.done !== done || seen.remaining !== remaining) {
    setSeen({ done, remaining });
    setDelta(0);
  }

  useEffect(() => {
    const onDone = (event: Event) => setDelta((d) => d + ((event as CustomEvent<number>).detail ?? 0));
    window.addEventListener(TASK_DONE_EVENT, onDone);
    return () => window.removeEventListener(TASK_DONE_EVENT, onDone);
  }, []);

  const shownDone = Math.max(0, done + delta);
  const shownRemaining = Math.max(0, remaining - delta);
  const total = shownDone + shownRemaining;

  return (
    <section className="flex items-center gap-5 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <ProgressRing
        key={shownDone}
        fraction={total > 0 ? shownDone / total : 0}
        size={104}
        stroke={9}
      >
        <div aria-live="polite">
          <p className="font-display text-4xl leading-none tabular-nums">{shownDone}</p>
          <p className="mt-0.5 text-[0.65rem] tracking-wide text-muted-foreground uppercase">done</p>
        </div>
      </ProgressRing>
      <div className="min-w-0">
        <p className="text-eyebrow text-muted-foreground">Today</p>
        <p className="font-display text-2xl leading-tight">{note(shownDone, shownRemaining)}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {shownRemaining === 0 ? "Your plate is clear." : `${shownRemaining} still on your plate.`}
        </p>
      </div>
    </section>
  );
}
