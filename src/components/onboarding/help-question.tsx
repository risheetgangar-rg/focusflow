"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { completeOnboardingAction } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { HELP_AREAS } from "@/lib/tasks/personal";
import { cn } from "@/lib/utils";

const MAX = 3;

/**
 * The one first-time question (build plan step 5). Skippable. What they pick
 * comes first on Today, and gets smarter first steps.
 */
export function HelpQuestion() {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(value: string) {
    setPicked((p) => (p.includes(value) ? p.filter((v) => v !== value) : p.length >= MAX ? p : [...p, value]));
  }

  function save(areas: string[]) {
    startTransition(async () => {
      const result = await completeOnboardingAction({
        focusAreas: areas,
        gamificationMode: "off",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (!result.ok) {
        setError(result.error ?? "That didn't save. Try again?");
        return;
      }
      router.push("/today");
    });
  }

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-5 py-12">
      <p className="text-eyebrow text-muted-foreground">One quick question</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">What do you mostly need help with?</h1>
      <p className="mt-3 text-muted-foreground">Pick up to three. These come first, with smarter first steps.</p>

      <div className="mt-8 grid gap-3" role="group" aria-label="What you need help with">
        {HELP_AREAS.map((area) => {
          const on = picked.includes(area.value);
          const full = !on && picked.length >= MAX;
          return (
            <button
              key={area.value}
              type="button"
              onClick={() => toggle(area.value)}
              aria-pressed={on}
              disabled={full}
              className={cn(
                "flex h-14 items-center justify-between rounded-2xl border px-5 text-left text-base font-medium transition-all",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/25",
                full && "opacity-45",
              )}
            >
              {area.label}
              {on && <Check size={18} />}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-muted-foreground">{error}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="brand" size="lg" disabled={pending || picked.length === 0} onClick={() => save(picked)}>
          {pending ? "Saving…" : "Continue"}
        </Button>
        <Button variant="ghost" size="lg" disabled={pending} onClick={() => save([])}>
          Skip
        </Button>
      </div>
    </main>
  );
}
