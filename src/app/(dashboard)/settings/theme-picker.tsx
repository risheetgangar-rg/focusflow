"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { setThemeAction } from "@/app/(dashboard)/settings/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { applyTheme } from "@/components/layout/theme-sync";
import { THEMES, isThemeUnlocked, type ThemeDefinition } from "@/lib/gamification/rules";
import { cn } from "@/lib/utils";
import type { GamificationMode } from "@/types/user";

/** A tiny page drawn in the theme's own colors: background, ink lines, accent. */
function ThemePreview({ swatch, locked }: { swatch: ThemeDefinition["swatch"]; locked: boolean }) {
  const [background, ink, accent] = swatch;

  return (
    <span
      aria-hidden
      className={cn("relative block overflow-hidden rounded-2xl border border-foreground/10 p-3.5", locked && "opacity-55")}
      style={{ backgroundColor: background }}
    >
      <span className="block h-2 w-2/5 rounded-full" style={{ backgroundColor: ink }} />
      <span className="mt-2 block h-1.5 w-4/5 rounded-full opacity-35" style={{ backgroundColor: ink }} />
      <span className="mt-1.5 block h-1.5 w-3/5 rounded-full opacity-20" style={{ backgroundColor: ink }} />
      <span className="mt-4 flex items-center gap-2">
        <span className="h-6 w-14 rounded-full" style={{ backgroundColor: accent }} />
        <span className="size-6 rounded-full border-2" style={{ borderColor: accent }} />
      </span>
    </span>
  );
}

/** Pick how FocusFlow looks. With the full game layer on, some themes unlock as you level up. */
export function ThemePicker({
  currentTheme,
  level,
  mode,
}: {
  currentTheme: string;
  level: number;
  mode: GamificationMode;
}) {
  const router = useRouter();
  const { notify } = useCelebration();
  const [selected, setSelected] = useState(currentTheme);
  const [pending, startTransition] = useTransition();

  function choose(theme: ThemeDefinition) {
    if (!isThemeUnlocked(theme, level, mode)) {
      notify({
        title: `${theme.name} unlocks at level ${theme.unlockLevel}`,
        detail: "Keep going. You're closer than you think.",
      });
      return;
    }
    if (theme.id === selected || pending) return;

    const previous = selected;
    setSelected(theme.id);
    startTransition(async () => {
      try {
        const result = await setThemeAction(theme.id);
        if (result.ok) {
          applyTheme(theme.id);
          notify({ title: `Theme: ${theme.name}` });
          router.refresh();
        } else {
          setSelected(previous);
          notify({ title: "Couldn't change the theme", detail: result.error });
        }
      } catch {
        setSelected(previous);
        notify({ title: "Couldn't change the theme", detail: "Give it another try in a moment." });
      }
    });
  }

  return (
    <div role="radiogroup" aria-label="Visual theme" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {THEMES.map((theme) => {
        const unlocked = isThemeUnlocked(theme, level, mode);
        const isSelected = selected === theme.id;

        return (
          <label key={theme.id} className={cn("relative block", unlocked ? "cursor-pointer" : "cursor-not-allowed")}>
            <input
              type="radio"
              name="theme"
              value={theme.id}
              checked={isSelected}
              aria-disabled={!unlocked}
              onChange={() => choose(theme)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "block rounded-3xl border border-border bg-card p-2.5 transition-all duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-ring/30",
                unlocked && !isSelected && "hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-soft",
                isSelected && "border-brand shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--brand)]",
              )}
            >
              <span className="relative block">
                <ThemePreview swatch={theme.swatch} locked={!unlocked} />
                {!unlocked && (
                  <span
                    aria-hidden
                    className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-card/90 text-foreground shadow-soft"
                  >
                    <Lock className="size-3.5" />
                  </span>
                )}
              </span>

              <span className="mt-3 flex items-start justify-between gap-2 px-1.5 pb-1">
                <span className={cn("min-w-0", !unlocked && "opacity-80")}>
                  <span className="block text-sm font-semibold">{theme.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {unlocked ? theme.blurb : `Unlocks at level ${theme.unlockLevel}`}
                  </span>
                </span>
                {isSelected && (
                  <span
                    aria-hidden
                    className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
