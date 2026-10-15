"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { setGamificationModeAction } from "@/app/(dashboard)/settings/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { cn } from "@/lib/utils";
import type { GamificationMode } from "@/types/user";

const OPTIONS: { value: GamificationMode; title: string; blurb: string; icon: LucideIcon; tint: string }[] = [
  {
    value: "off",
    title: "Off",
    blurb: "No game layer at all. Just your tasks, habits and focus time.",
    icon: EyeOff,
    tint: "bg-tint-sky",
  },
  {
    value: "light",
    title: "Light",
    blurb: "XP, levels and momentum, with small celebrations when you finish things.",
    icon: Sparkles,
    tint: "bg-tint-butter",
  },
  {
    value: "full",
    title: "Full",
    blurb: "Everything in Light, plus daily quests, achievements, boss tasks, a companion and unlockable themes.",
    icon: Trophy,
    tint: "bg-tint-lavender",
  },
];

/** How much game do you want? Three plain choices, changeable any time. */
export function GameLayerPicker({ current }: { current: GamificationMode }) {
  const router = useRouter();
  const { notify } = useCelebration();
  const [mode, setMode] = useState(current);
  const [pending, startTransition] = useTransition();

  function choose(next: GamificationMode) {
    if (next === mode || pending) return;

    const previous = mode;
    setMode(next);
    startTransition(async () => {
      try {
        const result = await setGamificationModeAction(next);
        if (!result.ok) throw new Error("not saved");
        notify({
          title: `Game layer: ${OPTIONS.find((o) => o.value === next)?.title}`,
          detail: next === "off" ? "Quiet mode. No points, no pop-ups." : undefined,
        });
        router.refresh();
      } catch {
        setMode(previous);
        notify({ title: "Couldn't change that", detail: "Give it another try in a moment." });
      }
    });
  }

  return (
    <div role="radiogroup" aria-label="Game layer" className="grid gap-3 md:grid-cols-3 md:gap-4">
      {OPTIONS.map(({ value, title, blurb, icon: Icon, tint }) => {
        const selected = mode === value;
        return (
          <label key={value} className="relative block cursor-pointer">
            <input
              type="radio"
              name="gamificationMode"
              value={value}
              checked={selected}
              onChange={() => choose(value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-full gap-4 rounded-3xl border border-border bg-card p-5 transition-all duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-ring/30 md:flex-col md:gap-5",
                !selected && "hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-soft",
                selected && "border-brand shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--brand)]",
              )}
            >
              <span className="flex items-start justify-between md:w-full">
                <span className={cn("grid size-11 place-items-center rounded-full", tint)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {selected && (
                  <span
                    aria-hidden
                    className="hidden size-6 place-items-center rounded-full bg-brand text-brand-foreground md:grid"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-2xl leading-none">{title}</span>
                <span className="mt-2 block text-sm text-muted-foreground">{blurb}</span>
              </span>
              {selected && (
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground md:hidden"
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
