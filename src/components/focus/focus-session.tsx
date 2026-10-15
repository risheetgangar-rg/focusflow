"use client";

import { AnimatePresence, m } from "motion/react";
import { Check, LoaderCircle, Pause, Play, SkipForward } from "lucide-react";
import { FocusRing, TimeDisplay } from "@/components/focus/focus-ring";
import { formatClock, spokenClock, type FocusStep } from "@/components/focus/focus-logic";
import { TimesUpPanel } from "@/components/focus/times-up-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

function StepDots({ steps, currentKey }: { steps: FocusStep[]; currentKey: string }) {
  return (
    <ol aria-label="Steps" className="flex items-center justify-center gap-2">
      {steps.map((step, i) => {
        const current = step.key === currentKey;
        return (
          <li
            key={step.key}
            aria-current={current ? "step" : undefined}
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              step.completed ? "w-2 bg-brand" : current ? "w-7 bg-brand/70" : "w-2 bg-foreground/15",
            )}
          >
            <span className="sr-only">
              Step {i + 1}: {step.title}
              {step.completed ? " (done)" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Focus Mode's main screen: a ring, the one thing you're doing, and a single
 * obvious button. The timer is optional; with none it just counts up gently.
 */
export function FocusSession({
  step,
  steps,
  eyebrow,
  elapsedMs,
  limitMs,
  segmentStartMs,
  running,
  busy,
  error,
  canSkip,
  onTogglePause,
  onSkip,
  onComplete,
  onExtend,
  onExit,
}: {
  step: FocusStep;
  /** Every step, for the dots. Empty for a task with no steps. */
  steps: FocusStep[];
  eyebrow: string;
  elapsedMs: number;
  /** Total active time allowed, or null when there's no timer. */
  limitMs: number | null;
  /** Elapsed time when the current countdown began (it restarts on Continue). */
  segmentStartMs: number;
  running: boolean;
  busy: boolean;
  error: string | null;
  canSkip: boolean;
  onTogglePause: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onExtend: () => void;
  onExit: () => void;
}) {
  const countdown = limitMs !== null;
  const remainingMs = countdown ? Math.max(0, limitMs - elapsedMs) : 0;
  const timesUp = countdown && remainingMs === 0;
  const segmentMs = countdown ? Math.max(1, limitMs - segmentStartMs) : 1;
  const seconds = countdown ? Math.ceil(remainingMs / 1000) : Math.floor(elapsedMs / 1000);
  const paused = !running;

  const caption = timesUp ? "time's up" : paused ? "paused" : countdown ? "left" : "focusing";
  const announcement = timesUp ? "Time's up." : paused ? "Paused." : "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 text-center sm:gap-7">
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className={cn("transition-opacity duration-700", paused && "opacity-60")}>
        <FocusRing fraction={remainingMs / segmentMs} countdown={countdown} paused={paused}>
          <TimeDisplay text={formatClock(seconds)} spoken={spokenClock(seconds)} />
          <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{caption}</span>
        </FocusRing>
      </div>

      <div className="flex h-6 items-center justify-center">
        <AnimatePresence initial={false}>
          {paused && !timesUp && (
            <m.p
              key="paused"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              Paused. Take your time.
            </m.p>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full space-y-4">
        <AnimatePresence mode="wait" initial={false}>
          <m.h1
            key={step.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="font-display text-3xl leading-tight text-balance [overflow-wrap:anywhere] sm:text-5xl"
          >
            {step.title}
          </m.h1>
        </AnimatePresence>
        <div className="flex flex-col items-center gap-2">
          {steps.length > 0 && <StepDots steps={steps} currentKey={step.key} />}
          <p className="text-eyebrow">{eyebrow}</p>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {timesUp ? (
          <m.div
            key="times-up"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="w-full"
          >
            <TimesUpPanel busy={busy} onContinue={onExtend} onComplete={onComplete} onExit={onExit} />
          </m.div>
        ) : (
          <m.div
            key="controls"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex w-full flex-col items-center gap-3"
          >
            <Button variant="brand" size="xl" className="w-full max-w-xs" onClick={onComplete} disabled={busy}>
              {busy ? <LoaderCircle className="animate-spin" /> : <Check />} Complete
            </Button>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="lg" onClick={onTogglePause} disabled={busy}>
                {paused ? <Play /> : <Pause />} {paused ? "Resume" : "Pause"}
              </Button>
              {canSkip && (
                <Button variant="ghost" size="lg" onClick={onSkip} disabled={busy}>
                  <SkipForward /> Skip
                </Button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
