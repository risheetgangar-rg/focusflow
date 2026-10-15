"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, CalendarClock, Clock, RefreshCw, Zap } from "lucide-react";
import { Companion } from "@/components/gamification/companion";
import { useApp } from "@/components/providers/app-context";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { describeDue } from "@/lib/dates/format";
import { companionStage } from "@/lib/gamification/rules";
import { shouldSuggestBreakdown } from "@/lib/tasks/task-breaker";
import { cn } from "@/lib/utils";
import { recommendTop } from "@/services/recommendation-service";
import type { Task } from "@/types/task";

const TIME_CHOICES = [
  { label: "5 min", minutes: 5 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "An hour+", minutes: 60 },
];

/**
 * The one answer Today exists to give: "what should I do right now?" Shows a
 * single task, why it was picked, and a big Start. Tell it how much time you
 * have and it re-ranks instantly, no round trip.
 */
export function WhatsNextHero({
  tasks,
  stepCounts,
  nowIso,
  level,
}: {
  tasks: Task[];
  stepCounts: Record<string, number>;
  nowIso: string;
  level: number;
}) {
  const { timezone, mode } = useApp();
  const [available, setAvailable] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);

  const ranked = useMemo(
    () => recommendTop(tasks, { now: new Date(nowIso), availableMinutes: available ?? undefined, timezone }, 4),
    [tasks, nowIso, available, timezone],
  );
  const current = ranked.length > 0 ? ranked[offset % ranked.length] : null;

  const due = current?.task.dueAt ? describeDue(current.task.dueAt, new Date(nowIso), timezone) : null;
  const hard =
    current &&
    shouldSuggestBreakdown({
      friction: current.task.friction,
      estimatedMinutes: current.task.estimatedMinutes,
      subtaskCount: stepCounts[current.task.id] ?? 0,
    });

  return (
    <section
      aria-labelledby="whats-next"
      className="bg-grain relative overflow-hidden rounded-[2rem] bg-tint-lavender p-6 shadow-soft sm:p-10"
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-tint-peach blur-3xl animate-float-slow" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-10 size-64 rounded-full bg-tint-sky blur-3xl animate-float" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <h2 id="whats-next" className="text-eyebrow text-foreground/60">
            What&apos;s next
          </h2>
          {mode === "full" && current && (
            <Companion stage={companionStage(level)} size={64} mood="happy" className="-mt-2 hidden sm:block" />
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {current ? (
            <m.div
              key={`${current.task.id}-${available}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 space-y-5"
            >
              <p className="font-display text-4xl leading-[1.05] text-balance sm:text-6xl">{current.task.title}</p>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{current.reason}</Badge>
                {due && (
                  <Badge variant="secondary" className="bg-card/70">
                    <CalendarClock /> {due.label}
                  </Badge>
                )}
                {current.task.estimatedMinutes && (
                  <Badge variant="secondary" className="bg-card/70">
                    <Clock /> {current.task.estimatedMinutes} min
                  </Badge>
                )}
              </div>

              {hard && (
                <p className="flex items-start gap-2 text-sm text-foreground/70">
                  <Zap size={16} className="mt-0.5 shrink-0 text-brand" />
                  This one&apos;s tricky to start. Start mode will help you find a tiny first step.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href={`/focus/${current.task.id}`} className={buttonVariants({ variant: "brand", size: "xl" })}>
                  {hard ? "Find a first step" : "Start"} <ArrowRight />
                </Link>
                {ranked.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setOffset((o) => o + 1)}
                    className={buttonVariants({ variant: "ghost", size: "lg" })}
                  >
                    <RefreshCw /> Show me another
                  </button>
                )}
              </div>
            </m.div>
          ) : (
            <m.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
            >
              <Companion stage={companionStage(level)} mood="sleepy" size={96} />
              <div>
                <p className="font-display text-4xl sm:text-5xl">You&apos;re clear for now.</p>
                <p className="mt-2 text-foreground/70">
                  Nothing is waiting on you. Add something above whenever it comes to mind.
                </p>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {tasks.some((t) => t.status === "pending" && t.estimatedMinutes) && (
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-5">
            <span className="mr-1 text-sm text-foreground/60">I have</span>
            {TIME_CHOICES.map((choice) => {
              const active = available === choice.minutes;
              return (
                <button
                  key={choice.minutes}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setAvailable(active ? null : choice.minutes);
                    setOffset(0);
                  }}
                  className={cn(
                    "h-9 rounded-full border border-foreground/10 bg-card/60 px-4 text-sm font-medium transition-all hover:bg-card",
                    active && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
