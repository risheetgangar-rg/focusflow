"use client";

import { useEffect, useState } from "react";
import { Archive, Hourglass, Leaf, Zap } from "lucide-react";
import { URGENCY_LABEL, urgencyOf, type Urgency } from "@/lib/tasks/personal";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

const ICON = { now: Zap, soon: Hourglass, whenever: Leaf, parked: Archive } as const;

/** Text colour, chip background and the thin card edge for each level. Colours live in globals.css. */
export const URGENCY_STYLE: Record<Urgency, { chip: string; edge: string }> = {
  now: { chip: "text-urgency-now bg-urgency-now/10", edge: "border-l-urgency-now" },
  soon: { chip: "text-urgency-soon bg-urgency-soon/10", edge: "border-l-urgency-soon" },
  whenever: { chip: "text-urgency-whenever bg-urgency-whenever/10", edge: "border-l-urgency-whenever" },
  // A date that has passed is calm and neutral, never red.
  parked: { chip: "text-muted-foreground bg-muted", edge: "border-l-border" },
};

/** Keeps urgency current as time passes (re-checked every minute), starting from the server's clock. */
export function useUrgency(task: Pick<Task, "dueAt" | "mustDo">, nowIso: string): Urgency {
  const [now, setNow] = useState(() => new Date(nowIso));
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return urgencyOf(task, now);
}

/** The urgency tag: always a word and an icon, never colour alone. */
export function UrgencyChip({ urgency, className }: { urgency: Urgency; className?: string }) {
  const Icon = ICON[urgency];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold",
        URGENCY_STYLE[urgency].chip,
        className,
      )}
    >
      <Icon size={12} aria-hidden /> {URGENCY_LABEL[urgency]}
    </span>
  );
}
