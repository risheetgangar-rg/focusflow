import { Check, Lock } from "lucide-react";
import { Companion } from "@/components/gamification/companion";
import {
  COMPANION_STAGE_NAMES,
  THEMES,
  companionStage,
  type CompanionStage,
  type ThemeDefinition,
} from "@/lib/gamification/rules";
import { cn } from "@/lib/utils";

type Unlock =
  | { kind: "theme"; theme: ThemeDefinition }
  | { kind: "companion"; stage: CompanionStage };

interface Step {
  level: number;
  unlocks: Unlock[];
}

/** Every level that opens something: themes and companion evolutions. */
function buildSteps(): Step[] {
  const byLevel = new Map<number, Unlock[]>();
  const add = (level: number, unlock: Unlock) => byLevel.set(level, [...(byLevel.get(level) ?? []), unlock]);

  for (const theme of THEMES) add(theme.unlockLevel, { kind: "theme", theme });

  const topLevel = Math.max(...THEMES.map((t) => t.unlockLevel), 5);
  let previous = companionStage(1);
  add(1, { kind: "companion", stage: previous });
  for (let level = 2; level <= topLevel; level++) {
    const stage = companionStage(level);
    if (stage > previous) {
      add(level, { kind: "companion", stage });
      previous = stage;
    }
  }

  return [...byLevel.entries()].sort(([a], [b]) => a - b).map(([level, unlocks]) => ({ level, unlocks }));
}

function UnlockChip({ unlock, open }: { unlock: Unlock; open: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pr-4 pl-2 text-sm",
        !open && "opacity-60",
      )}
    >
      {unlock.kind === "theme" ? (
        <>
          <span aria-hidden className="flex -space-x-1.5">
            {unlock.theme.swatch.map((color, i) => (
              <span
                key={i}
                className="size-5 rounded-full border-2 border-card"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          <span className="font-medium">{unlock.theme.name}</span>
          <span className="text-xs text-muted-foreground">theme</span>
        </>
      ) : (
        <>
          <Companion stage={unlock.stage} mood="happy" size={30} float={false} />
          <span className="font-medium">{COMPANION_STAGE_NAMES[unlock.stage]}</span>
          <span className="text-xs text-muted-foreground">companion</span>
        </>
      )}
    </span>
  );
}

/** A friendly map of what each level opens. What you've already unlocked is checked off. */
export function UnlockRoadmap({ level }: { level: number }) {
  const steps = buildSteps();
  const nextLevel = steps.find((s) => s.level > level)?.level;

  return (
    <section aria-labelledby="roadmap-heading">
      <h2 id="roadmap-heading" className="font-display text-3xl">
        What you unlock
      </h2>
      <p className="mt-2 text-muted-foreground">New looks and a companion that grows with you.</p>

      <ol className="mt-5 grid gap-3 sm:gap-4">
        {steps.map((step) => {
          const open = step.level <= level;
          const isNext = step.level === nextLevel;
          return (
            <li
              key={step.level}
              className={cn(
                "flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6",
                open ? "border-border/80 bg-card shadow-soft" : "border-dashed border-border bg-muted/30",
                isNext && "border-brand/50",
              )}
            >
              <div className="flex shrink-0 items-center gap-3 sm:w-48">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    open ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {open ? <Check className="size-[1.1rem]" strokeWidth={3} aria-hidden /> : <Lock className="size-4" aria-hidden />}
                </span>
                <div>
                  <p className="font-display text-2xl leading-none">Level {step.level}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {open ? "Unlocked" : isNext ? "Up next" : "Keep going"}
                  </p>
                </div>
              </div>

              <ul className="flex flex-wrap gap-2.5">
                {step.unlocks.map((unlock) => (
                  <li key={unlock.kind === "theme" ? unlock.theme.id : `stage-${unlock.stage}`}>
                    <UnlockChip unlock={unlock} open={open} />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
