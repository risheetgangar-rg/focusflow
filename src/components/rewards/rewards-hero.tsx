import { Companion, type CompanionMood } from "@/components/gamification/companion";
import { COMPANION_STAGE_NAMES, type CompanionStage } from "@/lib/gamification/rules";
import { XpBar } from "./xp-bar";

function Stat({ value, label, hint }: { value: number; label: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-card/60 px-3 py-3 text-left sm:px-4">
      <p className="font-display text-2xl leading-none tabular-nums sm:text-3xl">{value.toLocaleString("en-US")}</p>
      <p className="mt-1.5 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/** The big moment: your companion, your level, how far to the next one, and your momentum. */
export function RewardsHero({
  level,
  title,
  stage,
  mood,
  xpIntoLevel,
  xpForNextLevel,
  fraction,
  totalXp,
  momentum,
  bestMomentum,
}: {
  level: number;
  title: string;
  stage: CompanionStage;
  mood: CompanionMood;
  xpIntoLevel: number;
  xpForNextLevel: number;
  fraction: number;
  totalXp: number;
  momentum: number;
  bestMomentum: number;
}) {
  const toGo = Math.max(0, xpForNextLevel - xpIntoLevel);

  return (
    <section
      aria-labelledby="level-heading"
      className="relative overflow-hidden rounded-[2rem] bg-brand-soft p-6 sm:p-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-tint-butter/70 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:gap-12 md:text-left">
        <div className="grid shrink-0 place-items-center rounded-full bg-card/55 p-6 shadow-soft">
          <Companion stage={stage} mood={mood} size={168} />
        </div>

        <div className="w-full min-w-0 flex-1 space-y-6">
          <div>
            <p className="text-eyebrow">
              Pip · {COMPANION_STAGE_NAMES[stage]} form
            </p>
            <h2 id="level-heading" className="mt-2 font-display text-6xl leading-none sm:text-7xl">
              Level {level}
            </h2>
            <p className="mt-2 text-lg text-foreground/75">{title}</p>
          </div>

          <div>
            <XpBar fraction={fraction} label={`Progress to level ${level + 1}`} />
            <p className="mt-2.5 flex flex-wrap justify-between gap-x-4 text-sm text-foreground/75">
              <span>
                {xpIntoLevel.toLocaleString("en-US")} of {xpForNextLevel.toLocaleString("en-US")} XP
              </span>
              <span>
                {toGo.toLocaleString("en-US")} XP to level {level + 1}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <Stat
              value={momentum}
              label="Momentum"
              hint={momentum > 0 ? "in this stretch" : "builds as you go"}
            />
            <Stat value={bestMomentum} label="Best" hint="longest stretch" />
            <Stat value={totalXp} label="Total XP" hint="all time" />
          </div>
        </div>
      </div>
    </section>
  );
}
