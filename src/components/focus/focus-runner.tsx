"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import {
  completeSubtaskStepAction,
  completeTaskStepAction,
  endFocusSessionAction,
  startFocusSessionAction,
} from "@/app/focus/actions";
import { FocusDone } from "@/components/focus/focus-done";
import { EXTEND_MINUTES, focusEyebrow, mergeOutcomes, planFocus, type FocusStep } from "@/components/focus/focus-logic";
import { FocusSession } from "@/components/focus/focus-session";
import { FocusHeader, FocusStage } from "@/components/focus/focus-stage";
import { FocusStart } from "@/components/focus/focus-start";
import { FocusUnavailable } from "@/components/focus/focus-unavailable";
import { useFocusClock } from "@/components/focus/use-focus-clock";
import { useCelebration } from "@/components/gamification/celebration-provider";
import type { CompletionOutcome } from "@/types/gamification";
import type { Subtask, Task } from "@/types/task";

type Phase = "start" | "focus" | "done";
type Busy = "completing" | "leaving" | null;

const phaseMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

/**
 * Focus Mode: start (pick a timer, or don't), focus (one step at a time),
 * done. It's the only thing on the screen: no backlog, no other tasks.
 */
export function FocusRunner({ task, subtasks }: { task: Task; subtasks: Subtask[] }) {
  const router = useRouter();
  const { celebrate } = useCelebration();
  const clock = useFocusClock();

  // Decided once, on arrival. Finishing the task here re-renders this page with the
  // task marked complete, and that must not swap the "Nice work" screen for "Already done".
  const [arrivedAs] = useState(task.status);

  const [phase, setPhase] = useState<Phase>("start");
  const [doneKeys, setDoneKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [skipped, setSkipped] = useState<readonly string[]>([]);
  // The step being finished, held in place while the server catches up so the screen doesn't flicker.
  const [pinned, setPinned] = useState<FocusStep | null>(null);
  const [limitMs, setLimitMs] = useState<number | null>(null);
  const [segmentStartMs, setSegmentStartMs] = useState(0);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  // The session row is created in the background so Start feels instant; later calls wait for it.
  const sessionRef = useRef<Promise<string | null> | null>(null);

  // Moves keyboard focus into each new screen, but not on first load.
  const focusPanel = useCallback((node: HTMLDivElement | null) => {
    if (node && sessionRef.current) node.focus({ preventScroll: true });
  }, []);

  if (arrivedAs !== "pending") {
    return <FocusUnavailable title={task.title} reason={arrivedAs === "completed" ? "completed" : "removed"} />;
  }

  const plan = planFocus(task.title, subtasks, doneKeys, skipped);
  const current = pinned ?? plan.queue[0];
  const isFinal = plan.queue.length <= 1;
  const canSkip = !pinned && plan.queue.length > 1;
  const eyebrow = focusEyebrow(plan, current.key);

  function begin(minutes: number | null) {
    if (sessionRef.current) return; // already started (a double tap, or the start screen fading out)
    setError(null);
    sessionRef.current = startFocusSessionAction(task.id, minutes).catch(() => null);
    setLimitMs(minutes === null ? null : minutes * 60_000);
    setSegmentStartMs(0);
    clock.start();
    setPhase("focus");
  }

  function skip() {
    if (!canSkip || busy) return;
    setSkipped((prev) => [...prev.filter((key) => key !== current.key), current.key]);
  }

  async function complete() {
    if (busy) return;
    const step = current;
    const last = isFinal;
    setBusy("completing");
    setError(null);
    setPinned(step);
    try {
      if (step.id) await completeSubtaskStepAction(step.id);
      if (!last) {
        setDoneKeys((prev) => new Set(prev).add(step.key));
        setSkipped((prev) => prev.filter((key) => key !== step.key));
        return;
      }
      const taskOutcome = await completeTaskStepAction(task.id);
      const sessionId = await sessionRef.current;
      const focusOutcome = sessionId ? await endFocusSessionAction(sessionId, true) : null;
      const merged = mergeOutcomes(taskOutcome, focusOutcome);
      celebrate(merged);
      setOutcome(merged);
      clock.pause();
      setPhase("done");
    } catch {
      setError("That didn't save. Give it another try.");
    } finally {
      setPinned(null);
      setBusy(null);
    }
  }

  async function exit() {
    if (busy) return;
    setBusy("leaving");
    try {
      const sessionId = await sessionRef.current;
      if (sessionId) await endFocusSessionAction(sessionId, false);
    } catch {
      // Leaving matters more than closing out the session record.
    }
    router.push("/today");
  }

  function extend() {
    setSegmentStartMs(clock.elapsedMs);
    setLimitMs(clock.elapsedMs + EXTEND_MINUTES * 60_000);
  }

  return (
    <FocusStage header={<FocusHeader title={task.title} onExit={phase === "done" ? undefined : exit} busy={busy !== null} />}>
      <p role="status" className="sr-only">
        {phase === "done" ? "Task complete. Nice work." : ""}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {phase === "start" && (
          <m.div key="start" ref={focusPanel} tabIndex={-1} className="outline-none" {...phaseMotion}>
            <FocusStart
              task={task}
              stepTitle={current.title}
              eyebrow={eyebrow}
              stepCount={subtasks.length}
              canSkip={canSkip}
              onStart={begin}
              onSkip={skip}
            />
          </m.div>
        )}
        {phase === "focus" && (
          <m.div key="focus" ref={focusPanel} tabIndex={-1} className="outline-none" {...phaseMotion}>
            <FocusSession
              step={current}
              steps={plan.steps}
              eyebrow={eyebrow}
              elapsedMs={clock.elapsedMs}
              limitMs={limitMs}
              segmentStartMs={segmentStartMs}
              running={clock.running}
              busy={busy !== null}
              error={error}
              canSkip={canSkip}
              onTogglePause={clock.running ? clock.pause : clock.resume}
              onSkip={skip}
              onComplete={complete}
              onExtend={extend}
              onExit={exit}
            />
          </m.div>
        )}
        {phase === "done" && (
          <m.div key="done" ref={focusPanel} tabIndex={-1} className="outline-none" {...phaseMotion}>
            <FocusDone taskTitle={task.title} outcome={outcome} />
          </m.div>
        )}
      </AnimatePresence>
    </FocusStage>
  );
}
