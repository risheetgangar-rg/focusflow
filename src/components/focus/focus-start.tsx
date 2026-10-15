"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, Clock, Sparkles, Swords } from "lucide-react";
import { applyBreakdownAction } from "@/app/(dashboard)/tasks/actions";
import { BreakdownPreview } from "@/components/focus/breakdown-preview";
import { headlineSize, resolveTimer, type TimerValue } from "@/components/focus/focus-logic";
import { TimerChoice } from "@/components/focus/timer-choice";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { useApp } from "@/components/providers/app-context";
import { Button } from "@/components/ui/button";
import { getTaskBreaker, shouldSuggestBreakdown } from "@/lib/tasks/task-breaker";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

const EASE = [0.22, 1, 0.36, 1] as const;

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3.5 text-sm text-muted-foreground backdrop-blur [&_svg]:size-4">
      {children}
    </span>
  );
}

/**
 * Step one of Focus Mode: one thing on screen, an optional timer, and a big
 * Start. A task with no steps that looks big gets a small, editable suggestion
 * for how to begin, never saved until it's accepted.
 */
export function FocusStart({
  task,
  stepTitle,
  eyebrow,
  stepCount,
  canSkip,
  onStart,
  onSkip,
}: {
  task: Pick<Task, "id" | "title" | "estimatedMinutes" | "friction" | "isBoss">;
  stepTitle: string;
  eyebrow: string;
  /** How many steps the task already has. */
  stepCount: number;
  canSkip: boolean;
  onStart: (minutes: number | null) => void;
  onSkip: () => void;
}) {
  const router = useRouter();
  const { notify } = useCelebration();
  const { mode } = useApp();

  const [timer, setTimer] = useState<TimerValue>("none");
  const [custom, setCustom] = useState("20");
  const selection = resolveTimer(timer, custom);

  const hasSteps = stepCount > 0;
  const looksBig = shouldSuggestBreakdown({
    friction: task.friction,
    estimatedMinutes: task.estimatedMinutes,
    subtaskCount: stepCount,
  });
  // Suggestions are computed up front but only ever shown, never saved, until accepted.
  const [draft, setDraft] = useState<string[] | null>(() =>
    looksBig ? getTaskBreaker().suggest({ title: task.title, estimatedMinutes: task.estimatedMinutes }) : null,
  );
  const [saving, setSaving] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  function openBreakdown() {
    setDraftError(null);
    setDraft(getTaskBreaker().suggest({ title: task.title, estimatedMinutes: task.estimatedMinutes }));
  }

  async function saveBreakdown() {
    const steps = (draft ?? []).map((s) => s.trim()).filter(Boolean);
    if (steps.length === 0) {
      setDraftError("Add at least one step.");
      return;
    }
    setSaving(true);
    setDraftError(null);
    try {
      const result = await applyBreakdownAction(task.id, steps);
      if (!result.ok) {
        setDraftError(result.error ?? "Couldn't add those steps.");
        return;
      }
      setDraft(null);
      notify({ title: "Steps added", detail: `${steps.length} small ${steps.length === 1 ? "step" : "steps"} to start with` });
      router.refresh();
    } catch {
      setDraftError("Couldn't save those steps. Try again?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
      <div className="space-y-5">
        <p className="text-eyebrow animate-rise">{eyebrow}</p>
        <AnimatePresence mode="wait" initial={false}>
          <m.h1
            key={stepTitle}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={cn("font-display leading-[1.04] text-balance [overflow-wrap:anywhere]", headlineSize(stepTitle))}
          >
            {stepTitle}
          </m.h1>
        </AnimatePresence>
      </div>

      {(task.estimatedMinutes || (task.isBoss && mode === "full")) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {task.estimatedMinutes ? (
            <Chip>
              <Clock /> ~{task.estimatedMinutes} min
            </Chip>
          ) : null}
          {task.isBoss && mode === "full" ? (
            <Chip>
              <Swords /> Boss task
            </Chip>
          ) : null}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {draft ? (
          <m.div
            key="breakdown"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex w-full justify-center"
          >
            <BreakdownPreview
              steps={draft}
              onChange={setDraft}
              onSave={saveBreakdown}
              onDismiss={() => setDraft(null)}
              saving={saving}
              error={draftError}
            />
          </m.div>
        ) : (
          <m.div
            key="controls"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex w-full flex-col items-center gap-7"
          >
            <TimerChoice
              value={timer}
              onValueChange={setTimer}
              custom={custom}
              onCustomChange={setCustom}
              customInvalid={timer === "custom" && !selection.valid}
            />

            <div className="flex flex-col items-center gap-2">
              <Button
                variant="brand"
                size="xl"
                className="min-w-52"
                disabled={!selection.valid}
                onClick={() => onStart(selection.minutes)}
              >
                Start <ArrowRight />
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-1">
                {canSkip && (
                  <Button variant="ghost" size="lg" onClick={onSkip}>
                    Skip
                  </Button>
                )}
                {!hasSteps && (
                  <Button variant="ghost" size="lg" onClick={openBreakdown}>
                    <Sparkles /> Break it down
                  </Button>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
