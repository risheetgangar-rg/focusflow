"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, type Variants } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { createQuickTaskAction } from "@/app/(dashboard)/tasks/actions";
import { completeOnboardingAction } from "@/app/onboarding/actions";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import type { GamificationMode } from "@/types/user";
import { FirstTaskStep } from "./first-task-step";
import { FocusStep } from "./focus-step";
import { toFocusAreaValues, type FocusAreaId } from "./options";
import type { PreviewItem } from "./preview";
import { RemindersStep } from "./reminders-step";
import { WelcomeStep } from "./welcome-step";

const STEP_COUNT = 4;
const EASE = [0.22, 1, 0.36, 1] as const;
const TRY_AGAIN = "Something went wrong on our side. Try again?";

// Steps slide in from the side you're heading towards, and out the other way.
const slide: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -36 }),
};

function ProgressBar({ step }: { step: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Setup progress"
      aria-valuemin={1}
      aria-valuemax={STEP_COUNT}
      aria-valuenow={step + 1}
      aria-valuetext={`Step ${step + 1} of ${STEP_COUNT}`}
      className="fixed inset-x-0 top-0 z-20 h-1 bg-muted/70"
    >
      <m.div
        className="h-full origin-left rounded-r-full bg-brand"
        initial={false}
        animate={{ scaleX: (step + 1) / STEP_COUNT }}
        transition={{ duration: 0.5, ease: EASE }}
      />
    </div>
  );
}

/**
 * Four short steps: say hello, say what helps, (optionally) allow reminders, add a first task.
 * Every step can be skipped, and nothing is saved until the last one, so there's nothing to lose by going back.
 */
export function OnboardingWizard({ initialName, isGuest }: { initialName: string; isGuest: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState(initialName);
  const [areas, setAreas] = useState<FocusAreaId[]>([]);
  const [mode, setMode] = useState<GamificationMode>("full");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What has already been saved, so trying again after a hiccup never saves anything twice.
  const profileSaved = useRef(false);
  const savedTasks = useRef(new Set<string>());

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError(null);
  }

  /**
   * Saves the profile first, so a first task's date and time are read in the right timezone,
   * then any tasks, then heads to `destination`.
   */
  async function finish(destination: string, items: PreviewItem[] = []) {
    setBusy(true);
    setError(null);
    try {
      if (!profileSaved.current) {
        const saved = await completeOnboardingAction({
          displayName: name.trim() || undefined,
          focusAreas: toFocusAreaValues(areas),
          gamificationMode: mode,
          // Read when the person finishes, not while rendering.
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        if (!saved.ok) {
          setError(saved.error ?? TRY_AGAIN);
          setBusy(false);
          return;
        }
        profileSaved.current = true;
      }

      for (const item of items) {
        if (savedTasks.current.has(item.key)) continue;
        const created = await createQuickTaskAction(item.task);
        if (!created.ok) {
          setError(created.error);
          setBusy(false);
          return;
        }
        savedTasks.current.add(item.key);
      }

      router.push(destination);
    } catch {
      setError(TRY_AGAIN);
      setBusy(false);
    }
  }

  return (
    <div className="bg-grain relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="animate-float-slow absolute -top-48 -left-40 size-[34rem] rounded-full bg-tint-lavender blur-3xl" />
        <div className="animate-float-slow absolute -right-44 -bottom-48 size-[32rem] rounded-full bg-tint-peach blur-3xl [animation-delay:-5s]" />
      </div>

      <ProgressBar step={step} />

      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-7 sm:px-8">
        <Logo />
        <p className="text-sm text-muted-foreground tabular-nums">
          Step {step + 1} of {STEP_COUNT}
        </p>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-6 pb-16 sm:px-8 sm:pt-10">
        <div className="min-h-9">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-3.5"
              disabled={busy}
              onClick={() => goTo(step - 1)}
            >
              <ArrowLeft aria-hidden />
              Back
            </Button>
          ) : null}
        </div>

        <div className="mt-5 flex-1">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <m.div
              key={step}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.34, ease: EASE }}
            >
              {step === 0 && <WelcomeStep name={name} onNameChange={setName} isGuest={isGuest} onNext={() => goTo(1)} />}
              {step === 1 && (
                <FocusStep
                  areas={areas}
                  onAreasChange={setAreas}
                  mode={mode}
                  onModeChange={setMode}
                  onNext={() => goTo(2)}
                  onSkip={() => goTo(2)}
                />
              )}
              {step === 2 && <RemindersStep onNext={() => goTo(3)} />}
              {step === 3 && (
                <FirstTaskStep
                  busy={busy}
                  error={error}
                  onAdd={(items) => void finish("/today", items)}
                  onSkip={() => void finish("/today")}
                  onDump={(items) => void finish("/brain-dump", items)}
                />
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
