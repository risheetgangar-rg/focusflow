"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { clearHabitCompletionAction, setHabitCompletionAction } from "@/app/(dashboard)/habits/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types/habit";

export interface HabitToday {
  habit: Habit;
  /** Done (or partly done) on `today`. */
  doneToday: boolean;
  /** Days this week with a completed or partial check-in. */
  weekCount: number;
}

function HabitRow({ item, today }: { item: HabitToday; today: string }) {
  const { celebrate, notify } = useCelebration();
  const [, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(item.doneToday);
  const { habit, weekCount } = item;

  // Reflect the optimistic tick in the weekly count until the server catches up.
  const shown = Math.max(0, Math.min(habit.targetCount, weekCount + Number(done) - Number(item.doneToday)));
  const dotColor = /^#[0-9a-f]{3,8}$/i.test(habit.color) ? habit.color : undefined;

  function toggle(checked: boolean) {
    startTransition(async () => {
      setDone(checked);
      if (!checked) {
        await clearHabitCompletionAction(habit.id, today);
        return;
      }
      const outcome = await setHabitCompletionAction(habit.id, today, "completed");
      if (outcome.reward) {
        celebrate(outcome, { undo: () => void clearHabitCompletionAction(habit.id, today) });
      } else {
        notify({
          title: "Checked in",
          detail: habit.name,
          action: { label: "Undo", onClick: () => void clearHabitCompletionAction(habit.id, today) },
        });
      }
    });
  }

  return (
    <li className="flex items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-3 transition-shadow hover:shadow-soft">
      <Checkbox
        checked={done}
        onCheckedChange={(checked) => toggle(checked === true)}
        aria-label={`${habit.name}: ${done ? "undo today's check-in" : "check in for today"}`}
      />
      <span
        aria-hidden
        className={cn("size-2.5 shrink-0 rounded-full", !dotColor && "bg-brand")}
        style={dotColor ? { backgroundColor: dotColor } : undefined}
      />
      <p className={cn("min-w-0 flex-1 truncate text-sm font-medium", done && "text-muted-foreground")}>{habit.name}</p>
      <div className="flex shrink-0 items-center gap-2" title={`${shown} of ${habit.targetCount} this week`}>
        <span className="flex gap-1" aria-hidden>
          {Array.from({ length: habit.targetCount }).map((_, i) => (
            <span key={i} className={cn("size-1.5 rounded-full", i < shown ? "bg-brand" : "bg-muted")} />
          ))}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {shown}/{habit.targetCount}
        </span>
      </div>
    </li>
  );
}

/** One-tap check-ins for today. The week view lives on /habits. */
export function TodayHabits({ items, today }: { items: HabitToday[]; today: string }) {
  return (
    <section aria-labelledby="today-habits" className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <h2 id="today-habits" className="font-display text-3xl">
          Habits
        </h2>
        <Link href="/habits" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          This week <ArrowRight size={14} />
        </Link>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <HabitRow key={item.habit.id} item={item} today={today} />
        ))}
      </ul>
    </section>
  );
}
