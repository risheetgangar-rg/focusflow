"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Check, Pause, Play, Plus, Star } from "lucide-react";
import { notNowAction } from "@/app/(dashboard)/today/card-actions";
import { completeTaskAction } from "@/app/(dashboard)/tasks/actions";
import { endFocusSessionAction, startFocusSessionAction } from "@/app/focus/actions";
import { formatClock } from "@/components/focus/focus-logic";
import { useFocusClock } from "@/components/focus/use-focus-clock";
import { URGENCY_STYLE, UrgencyChip, useUrgency } from "@/components/tasks/urgency-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

export interface CardTask {
  task: Task;
  reason: string;
  firstStep: string;
  amount: string | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const TIMERS = [
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "25 min", minutes: 25 },
  { label: "No timer", minutes: null },
];
const NOT_NOW_LIMIT = 2;

function notNowKey() {
  const d = new Date();
  return `unstuck-not-now-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function readNotNow(): number {
  try {
    return Number(localStorage.getItem(notNowKey()) ?? 0);
  } catch {
    return 0;
  }
}

function isSample(task: Task) {
  return task.description?.startsWith("Sample task") ?? false;
}

/** The calm timer that the card turns into after "Lock in". */
function FocusTimer({
  item,
  startMinutes,
  onDone,
  onPark,
}: {
  item: CardTask;
  startMinutes: number | null;
  onDone: (sessionId: Promise<string | null>) => void;
  onPark: (sessionId: Promise<string | null>) => void;
}) {
  const clock = useFocusClock();
  const [limit, setLimit] = useState<number | null>(startMinutes === null ? null : startMinutes * 60_000);
  const session = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    if (session.current) return;
    session.current = startFocusSessionAction(item.task.id, startMinutes).catch(() => null);
    clock.start();
    // Starting the clock once, when the timer first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elapsed = clock.elapsedMs;
  const remaining = limit === null ? null : Math.max(0, limit - elapsed);
  const timesUp = remaining === 0;
  const seconds = remaining === null ? Math.floor(elapsed / 1000) : Math.ceil(remaining / 1000);
  const sessionId = () => session.current ?? Promise.resolve(null);

  return (
    <div className="space-y-6 text-center">
      <div>
        <p className="text-eyebrow">Locked in</p>
        <p className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{item.task.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">First step:</span> {item.firstStep}
        </p>
      </div>

      <div
        className={cn(
          "mx-auto grid size-44 place-items-center rounded-full border-[6px] transition-colors",
          timesUp ? "border-tint-butter bg-tint-butter/50" : "border-brand/25",
        )}
        role="timer"
        aria-live="off"
      >
        <div>
          <p className="font-display text-5xl tabular-nums">{timesUp ? "Time's up" : formatClock(seconds)}</p>
          {!timesUp && (
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {!clock.running ? "paused" : remaining === null ? "focusing" : "left"}
            </p>
          )}
        </div>
      </div>

      {!timesUp && elapsed < 15_000 && (
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Timer length">
          {TIMERS.map((t) => {
            const active = (t.minutes === null && limit === null) || (t.minutes !== null && limit === t.minutes * 60_000);
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setLimit(t.minutes === null ? null : t.minutes * 60_000)}
                aria-pressed={active}
                className={cn(
                  "h-9 rounded-full border border-border px-4 text-sm font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {timesUp && (
          <Button variant="outline" size="lg" onClick={() => setLimit((l) => (l ?? elapsed) + 5 * 60_000)}>
            <Plus /> 5 min
          </Button>
        )}
        <Button variant="brand" size="lg" onClick={() => onDone(sessionId())}>
          <Check /> Done
        </Button>
        {timesUp ? (
          <Button variant="ghost" size="lg" onClick={() => onPark(sessionId())}>
            Park it
          </Button>
        ) : (
          <Button variant="ghost" size="lg" onClick={clock.running ? clock.pause : clock.resume}>
            {clock.running ? <Pause /> : <Play />} {clock.running ? "Pause" : "Resume"}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Today is one card: the task, why it's first, its first step, and two
 * buttons. "Lock in" turns the card into a timer right here; "Not now" saves
 * the task for tomorrow and shows the next one.
 */
export function TodayCard({
  items,
  nowIso,
  autoStartId,
  title,
  extraActions,
  onFinished,
  onEnough,
}: {
  items: CardTask[];
  nowIso: string;
  /** Start the timer straight away on this task ("Focus on this" from Tasks). */
  autoStartId?: string;
  /** A heading above the card (the comeback screen uses "Welcome back. Take one win."). */
  title?: React.ReactNode;
  extraActions?: React.ReactNode;
  onFinished?: () => void;
  /** After "Not now" twice: called once, so the comeback screen can step aside tomorrow. */
  onEnough?: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [hidden, setHidden] = useState<string[]>([]);
  const [phase, setPhase] = useState<"card" | "focus" | "done" | "enough">(() =>
    autoStartId && items[0]?.task.id === autoStartId ? "focus" : "card",
  );
  const [timerMinutes, setTimerMinutes] = useState<number | null>(10);
  const [finishedTitle, setFinishedTitle] = useState("");

  // "Focus on this" arrives as ?focus=…; tidy the address so a refresh doesn't restart the timer.
  useEffect(() => {
    if (!autoStartId) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("focus");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [autoStartId]);

  const visible = items.filter((i) => !hidden.includes(i.task.id));
  const item = visible[0] ?? null;
  const urgency = useUrgency(item?.task ?? { dueAt: null, mustDo: false }, nowIso);

  function notNow() {
    if (!item) return;
    const id = item.task.id;
    const count = readNotNow() + 1;
    try {
      localStorage.setItem(notNowKey(), String(count));
    } catch {
      // Storage blocked: the limit just won't carry over a reload.
    }
    setHidden((h) => [...h, id]);
    if (count >= NOT_NOW_LIMIT) {
      setPhase("enough");
      onEnough?.();
    }
    startTransition(() => notNowAction(id));
  }

  function finish(sessionId: Promise<string | null>) {
    if (!item) return;
    const id = item.task.id;
    setFinishedTitle(item.task.title);
    setHidden((h) => [...h, id]);
    setPhase("done");
    startTransition(async () => {
      await completeTaskAction(id);
      const sid = await sessionId;
      if (sid) await endFocusSessionAction(sid, true);
      onFinished?.();
      router.refresh();
    });
  }

  function park(sessionId: Promise<string | null>) {
    if (!item) return;
    const id = item.task.id;
    setHidden((h) => [...h, id]);
    setPhase("card");
    startTransition(async () => {
      const sid = await sessionId;
      if (sid) await endFocusSessionAction(sid, false);
      await notNowAction(id);
    });
  }

  const shell = "rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-10";

  return (
    <div className="space-y-5">
      {title}
      <AnimatePresence mode="wait" initial={false}>
        {phase === "enough" ? (
          <m.section key="enough" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn(shell, "text-center")}>
            <p className="font-display text-4xl sm:text-5xl">That&apos;s enough for today.</p>
            <p className="mt-3 text-muted-foreground">Your tasks are safe. They&apos;ll be here when you&apos;re ready.</p>
          </m.section>
        ) : phase === "done" ? (
          <m.section key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn(shell, "text-center")}>
            <p className="font-display text-5xl sm:text-6xl">Let&apos;s go! One off the pile!!</p>
            <p className="mt-3 text-muted-foreground line-through">{finishedTitle}</p>
            {item && (
              <Button variant="outline" size="lg" className="mt-6" onClick={() => setPhase("card")}>
                What&apos;s next
              </Button>
            )}
          </m.section>
        ) : !item ? (
          <m.section key="clear" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn(shell, "text-center")}>
            <p className="font-display text-4xl sm:text-5xl">You&apos;re clear for now.</p>
            <p className="mt-3 text-muted-foreground">Add something below whenever it comes to mind.</p>
          </m.section>
        ) : phase === "focus" ? (
          <m.section key={`focus-${item.task.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASE }} className={shell}>
            <FocusTimer item={item} startMinutes={timerMinutes} onDone={finish} onPark={park} />
          </m.section>
        ) : (
          <m.section
            key={`card-${item.task.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={cn(shell, "border-l-[6px]", URGENCY_STYLE[urgency].edge)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <UrgencyChip urgency={urgency} />
              <span className="text-sm text-muted-foreground">{item.reason}</span>
              {item.task.mustDo && !item.reason.startsWith("Must do") && (
                <Badge variant="secondary">
                  <Star /> Must do
                </Badge>
              )}
              {isSample(item.task) && <Badge variant="outline">Sample</Badge>}
            </div>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-balance sm:text-6xl">{item.task.title}</h2>
            <p className="mt-4 text-foreground/75">
              <span className="font-medium text-foreground">First step:</span> {item.firstStep}
              {item.amount ? ` · ${item.amount}` : ""}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                variant="brand"
                size="xl"
                onClick={() => {
                  setTimerMinutes(10);
                  setPhase("focus");
                }}
              >
                Lock in · 10 min
              </Button>
              <Button variant="ghost" size="lg" onClick={notNow}>
                Not now
              </Button>
              {extraActions}
            </div>
          </m.section>
        )}
      </AnimatePresence>
    </div>
  );
}
