import Link from "next/link";
import { Flame } from "lucide-react";
import { Companion } from "@/components/gamification/companion";
import { companionStage, levelProgress } from "@/lib/gamification/rules";
import type { GamificationMode } from "@/types/user";

/** Quiet progress card for the sidebar: level, XP to the next level, and current momentum. */
export function LevelCard({
  xp,
  momentum,
  mode,
}: {
  xp: number;
  momentum: number;
  mode: GamificationMode;
}) {
  if (mode === "off") return null;
  const progress = levelProgress(xp);

  return (
    <Link
      href="/rewards"
      className="mx-3 block rounded-2xl border border-sidebar-border bg-card p-3.5 shadow-soft transition-all hover:-translate-y-px hover:shadow-lift"
    >
      <div className="flex items-center gap-3">
        {mode === "full" ? (
          <Companion stage={companionStage(progress.level)} size={46} float={false} />
        ) : (
          <span className="grid size-11 place-items-center rounded-full bg-brand-soft font-display text-xl text-brand">
            {progress.level}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            Level {progress.level}
            <span className="font-normal text-muted-foreground"> · {progress.title}</span>
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-700"
              style={{ width: `${Math.max(4, progress.fraction * 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {progress.xpIntoLevel} / {progress.xpForNextLevel} XP
        </span>
        {momentum > 1 && (
          <span className="flex items-center gap-1 font-medium text-foreground/80">
            <Flame size={13} className="text-brand" /> {momentum}
          </span>
        )}
      </div>
    </Link>
  );
}
