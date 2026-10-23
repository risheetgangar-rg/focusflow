"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Check, X } from "lucide-react";
import { finishTaskAction, notNowAction, rateFeltAction } from "@/app/(dashboard)/today/card-actions";
import { endFocusSessionAction, extendFocusAction, startFocusSessionAction } from "@/app/focus/actions";
import { announceWin } from "@/components/rewards/win-layer";
import { clearTimer, showTimer } from "@/lib/notifications/local";
import { formatClock } from "@/components/focus/focus-logic";
import { useFocusClock } from "@/components/focus/use-focus-clock";
import { TONE_LABEL, TONE_STYLE, toneOf } from "@/lib/tasks/tone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Felt, Task } from "@/types/task";

export interface CardTask {
  task: Task;
  reason: string;
  firstStep: string;
  amount: string | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;
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

/**
 * Lock-in mode: the whole screen becomes just the timer and two buttons,
 * so nothing else competes for attention. Time is counted from timestamps,
 * so it stays right if you switch apps.
 */
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
  const fraction = limit === null ? 1 : Math.max(0, Math.min(1, (remaining ?? 0) / limit));
  const sessionId = () => session.current ?? Promise.resolve(null);

  // Mirror the timer in the phone's notification bar, and let its ✓ / Stop buttons work.
  const live = useRef({ remaining, elapsed, onDone, onPark });
  useEffect(() => {
    live.current = { remaining, elapsed, onDone, onPark };
  });
  useEffect(() => {
    const title = item.task.title;
    const update = () => void showTimer(title, live.current.remaining, live.current.elapsed);
    update();
    const id = window.setInterval(update, 30_000);
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "unstuck:timer") return;
      const sid = session.current ?? Promise.resolve(null);
      if (e.data.action === "timer-done") live.current.onDone(sid);
      else live.current.onPark(sid);
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      window.clearInterval(id);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      void clearTimer();
    };
  }, [item.task.title]);
  useEffect(() => {
    if (timesUp) void showTimer(item.task.title, 0, live.current.elapsed, true);
  }, [timesUp, item.task.title]);

  // Locked in means locked in: Back and closing the tab don't sneak away mid-timer.
  useEffect(() => {
    window.history.pushState({ lockedIn: true }, "", window.location.href);
    const stay = () => window.history.pushState({ lockedIn: true }, "", window.location.href);
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("popstate", stay);
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("popstate", stay);
      window.removeEventListener("beforeunload", warn);
    };
  }, []);

  const r = 120;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Locked in: ${item.task.title}`}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-12 bg-background px-6"
    >
      <div className="relative grid size-72 place-items-center animate-duo-pop sm:size-80" role="timer">
        <svg viewBox="0 0 280 280" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <circle cx="140" cy="140" r={r} fill="none" strokeWidth="18" className="stroke-muted" />
          <circle
            cx="140"
            cy="140"
            r={r}
            fill="none"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
            className={cn("transition-[stroke-dashoffset] duration-1000 ease-linear", timesUp ? "stroke-sunny" : "stroke-brand")}
          />
        </svg>
        <p className={cn("font-display text-6xl tabular-nums sm:text-7xl", timesUp && "text-[2.6rem] sm:text-5xl")}>
          {timesUp ? "Time's up" : formatClock(seconds)}
        </p>
      </div>

      <div className="flex w-full max-w-sm gap-3">
        {timesUp ? (
          <Button variant="outline" size="xl" className="flex-1" onClick={() => {
              setLimit((l) => (l ?? elapsed) + 5 * 60_000);
              void sessionId().then((sid) => (sid ? extendFocusAction(sid, 5) : undefined));
            }}>
            +5 min
          </Button>
        ) : (
          <Button variant="outline" size="xl" className="flex-1" onClick={() => onPark(sessionId())}>
            Stop timer
          </Button>
        )}
        <Button variant="brand" size="xl" className="flex-1" onClick={() => onDone(sessionId())}>
          Done
        </Button>
      </div>
    </div>
  );
}

const FELT: { value: Felt; label: string }[] = [
  { value: "easier", label: "Easier than I thought" },
  { value: "same", label: "About the same" },
  { value: "harder", label: "Harder" },
];

/** The dread meter: one optional tap. Skipping it is fine. */
function FeltQuestion({ taskId }: { taskId: string }) {
  const [answered, setAnswered] = useState<Felt | null>(null);
  if (answered)
    return (
      <p className="mt-3 text-sm font-semibold text-brand">
        {answered === "easier" ? "Noted. Your brain made it bigger than it was." : "Noted."}
      </p>
    );
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold">How did it feel?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {FELT.map((f) => (
          <Button
            key={f.value}
            variant="outline"
            size="sm"
            onClick={() => {
              setAnswered(f.value);
              void rateFeltAction(taskId, f.value);
            }}
          >
            {f.label}
          </Button>
        ))}
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
  // The task being worked on is held here, so a refresh that reorders the list
  // (or drops the ?focus= address) can never swap or stop the running timer.
  const [focusItem, setFocusItem] = useState<CardTask | null>(() =>
    autoStartId && items[0]?.task.id === autoStartId ? items[0] : null,
  );
  const [phase, setPhase] = useState<"card" | "focus" | "enough">(() => (focusItem ? "focus" : "card"));
  const [timerMinutes, setTimerMinutes] = useState<number | null>(10);
  const [finished, setFinished] = useState<{ id: string; title: string } | null>(null);

  // "Focus on this" arrives as ?focus=…. It stays in the address while the timer
  // runs (so any refresh keeps showing this task) and is tidied away when it ends.
  function leaveFocusAddress() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("focus")) return;
    url.searchParams.delete("focus");
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  const visible = items.filter((i) => !hidden.includes(i.task.id));
  const item = visible[0] ?? null;
  const tone = item ? toneOf(item.task, new Date(nowIso)) : "later";

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
    const target = focusItem ?? item;
    if (!target) return;
    const id = target.task.id;
    setFocusItem(null);
    leaveFocusAddress();
    setFinished({ id, title: target.task.title });
    setHidden((h) => [...h, id]);
    // Straight on to the next task; the win shows as a small card on top.
    setPhase("card");
    startTransition(async () => {
      // The timer is saved first so its minutes count towards this win.
      const sid = await sessionId;
      if (sid) await endFocusSessionAction(sid, true);
      announceWin(await finishTaskAction(id, sid));
      onFinished?.();
      router.refresh();
    });
  }

  /**
   * Stop just stops the timer. The task stays right here on the card, so
   * nothing vanishes; putting it off is what "Not now" is for.
   */
  function park(sessionId: Promise<string | null>) {
    setFocusItem(null);
    leaveFocusAddress();
    setPhase("card");
    startTransition(async () => {
      const sid = await sessionId;
      if (sid) await endFocusSessionAction(sid, false);
    });
  }

  const shell = "rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-10";

  return (
    <div className="space-y-5">
      {title}
      {finished && phase !== "focus" && (
        <m.div
          key={`finished-${finished.id}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border-2 border-lime bg-tint-mint px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 font-semibold">
              <Check size={18} className="shrink-0 text-brand" strokeWidth={3} />
              <span>
                Done: <span className="line-through decoration-2">{finished.title}</span>
              </span>
            </p>
            <button type="button" onClick={() => setFinished(null)} aria-label="Hide" className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <FeltQuestion key={finished.id} taskId={finished.id} />
        </m.div>
      )}
      <AnimatePresence mode="wait" initial={false}>
        {phase === "enough" ? (
          <m.section key="enough" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn(shell, "text-center")}>
            <p className="font-display text-4xl sm:text-5xl">That&apos;s enough for today.</p>
            <p className="mt-3 text-muted-foreground">Your tasks are safe. They&apos;ll be here when you&apos;re ready.</p>
          </m.section>
        ) : phase === "focus" && focusItem ? (
          <m.div key={`focus-${focusItem.task.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FocusTimer item={focusItem} startMinutes={timerMinutes} onDone={finish} onPark={park} />
          </m.div>
        ) : !item ? (
          <m.section key="clear" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn(shell, "text-center")}>
            <p className="font-display text-4xl sm:text-5xl">You&apos;re clear for now.</p>
            <p className="mt-3 text-muted-foreground">Add something below whenever it comes to mind.</p>
          </m.section>
        ) : (
          <m.section
            key={`card-${item.task.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={cn(shell, "border-l-[8px]", TONE_STYLE[tone].edge)}
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* The colour says how pressing it is; no labels. */}
              <span className={cn("size-3 rounded-full", TONE_STYLE[tone].dot)} aria-label={TONE_LABEL[tone]} />
              <span className="text-sm text-muted-foreground">{item.reason.replace(/^Must do · /, "")}</span>
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
                  setFocusItem(item);
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
