"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { Check, Hourglass } from "lucide-react";
import { completeTaskAction } from "@/app/(dashboard)/tasks/actions";
import { announceTaskDone } from "@/components/today/today-progress";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types/task";

/*
 * Waiting mode: for the trap where something later today (a dentist, a call,
 * a class) makes it feel impossible to start anything. It shows a countdown to
 * that thing and only the small tasks that fit before it.
 */

const MINUTE = 60_000;
const FITS_LIMIT = 3;

const WaitingContext = createContext<((task: Task) => void) | null>(null);

/** Tasks call this to enter waiting mode. Null outside the Tasks page. */
export function useWaitingMode() {
  return useContext(WaitingContext);
}

/** Waiting mode makes sense for something with a time that hasn't come yet. */
export function canWaitFor(task: Task, now: Date): boolean {
  return task.status === "pending" && !!task.dueAt && Date.parse(task.dueAt) > now.getTime();
}

/** Small things that fit in the gap: short ones first, quick kinds (calls, home) before others. */
export function fitsBefore(tasks: Task[], target: Task, minutesLeft: number): Task[] {
  const quick = (t: Task) => (t.taskType === "calls" || t.taskType === "home" ? 0 : 1);
  return tasks
    .filter((t) => t.id !== target.id && t.status === "pending" && !t.fixedDate && t.kind !== "reminder")
    .filter((t) => (t.estimatedMinutes ?? 10) <= Math.min(30, minutesLeft - 5))
    .sort((a, b) => (a.estimatedMinutes ?? 10) - (b.estimatedMinutes ?? 10) || quick(a) - quick(b))
    .slice(0, FITS_LIMIT);
}

function countdown(ms: number): string {
  const minutes = Math.ceil(ms / MINUTE);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

function WaitingScreen({ target, tasks, onExit }: { target: Task; tasks: Task[]; onExit: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const left = Date.parse(target.dueAt!) - now;
  const timeNow = left <= 0;
  const fits = timeNow ? [] : fitsBefore(tasks, target, left / MINUTE);

  function finish(task: Task) {
    setDone((d) => [...d, task.id]);
    announceTaskDone(1);
    startTransition(async () => {
      await completeTaskAction(task.id);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Waiting for ${target.title}`}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-10 overflow-y-auto bg-background px-6 py-10 text-center"
    >
      <div className="animate-duo-pop">
        <p className="text-eyebrow inline-flex items-center gap-2 text-muted-foreground">
          <Hourglass size={14} /> Waiting mode
        </p>
        <h2 className="mt-3 text-xl font-semibold text-balance">{target.title}</h2>
        <p className="mt-4 font-display text-6xl tabular-nums sm:text-7xl" role="timer">
          {timeNow ? "It's time" : countdown(left)}
        </p>
        <p className="mt-3 text-muted-foreground">
          {timeNow ? "Go get it. Everything else can wait." : "You have time. Here's what fits before then."}
        </p>
      </div>

      {fits.length > 0 && (
        <ul className="w-full max-w-sm space-y-2.5 text-left">
          {fits.map((t) => {
            const isDone = done.includes(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={isDone}
                  onClick={() => finish(t)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-transform active:translate-y-[2px] disabled:opacity-60"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-border">
                    {isDone && <Check size={16} className="text-brand" />}
                  </span>
                  <span className={isDone ? "line-through" : "font-medium"}>{t.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="outline" size="lg" onClick={onExit}>
        Exit waiting mode
      </Button>
    </div>
  );
}

/** Wraps the Tasks page so any task can open waiting mode with the rest of the list to pick from. */
export function WaitingModeProvider({ tasks, children }: { tasks: Task[]; children: React.ReactNode }) {
  const [target, setTarget] = useState<Task | null>(null);
  return (
    <WaitingContext.Provider value={setTarget}>
      {children}
      {target && <WaitingScreen target={target} tasks={tasks} onExit={() => setTarget(null)} />}
    </WaitingContext.Provider>
  );
}
