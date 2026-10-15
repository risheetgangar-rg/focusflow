import { Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AchievementStatus } from "@/repositories/gamification-repository";
import { dayLabel } from "./format";

const TINTS = [
  "bg-tint-lavender",
  "bg-tint-mint",
  "bg-tint-peach",
  "bg-tint-butter",
  "bg-tint-sky",
  "bg-tint-rose",
] as const;

/** Unlocked achievements glow with color; locked ones stay quiet and show how to earn them. */
export function AchievementsGallery({
  achievements,
  timezone,
}: {
  achievements: AchievementStatus[];
  timezone: string;
}) {
  const unlocked = achievements
    .filter((a) => a.unlockedAt)
    .sort((a, b) => String(b.unlockedAt).localeCompare(String(a.unlockedAt)));
  const locked = achievements.filter((a) => !a.unlockedAt);

  return (
    <section aria-labelledby="achievements-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="achievements-heading" className="font-display text-3xl">
          Achievements
        </h2>
        <p className="text-sm text-muted-foreground">
          {unlocked.length} of {achievements.length} unlocked
        </p>
      </div>

      {achievements.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Achievements will show up here as you go.</p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {unlocked.map((a, i) => (
            <li key={a.code} className={cn("flex flex-col gap-4 rounded-3xl p-5 sm:p-6", TINTS[i % TINTS.length])}>
              <span className="grid size-11 place-items-center rounded-full bg-card/70">
                <Trophy className="size-5" aria-hidden />
              </span>
              <div className="flex-1">
                <h3 className="font-display text-2xl leading-tight">{a.name}</h3>
                <p className="mt-1 text-sm text-foreground/75">{a.description}</p>
              </div>
              <p className="text-xs text-foreground/65">
                Unlocked {a.unlockedAt ? dayLabel(a.unlockedAt, timezone) : ""} · +{a.xpReward} XP
              </p>
            </li>
          ))}

          {locked.map((a) => (
            <li
              key={a.code}
              className="flex flex-col gap-4 rounded-3xl border border-dashed border-border bg-muted/40 p-5 sm:p-6"
            >
              <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                <Lock className="size-5" aria-hidden />
                <span className="sr-only">Locked</span>
              </span>
              <div className="flex-1">
                <h3 className="font-display text-2xl leading-tight text-foreground/70">{a.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              </div>
              <p className="text-xs text-muted-foreground">Not yet · +{a.xpReward} XP when you do</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
