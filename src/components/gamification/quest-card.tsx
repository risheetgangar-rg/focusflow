"use client";

import { useOptimistic, useTransition } from "react";
import { Compass, Target } from "lucide-react";
import { completeSideQuestAction } from "@/app/(dashboard)/today/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Quest } from "@/types/gamification";

/** Today's two small goals: the daily quest (3 important things) and a light side quest. */
export function QuestCard({ quests }: { quests: Quest[] }) {
  const { notify } = useCelebration();
  const [, startTransition] = useTransition();
  const daily = quests.find((q) => q.type === "daily");
  const side = quests.find((q) => q.type === "side");
  const [sideDone, setSideDone] = useOptimistic(side?.completed ?? false);

  if (!daily && !side) return null;

  function finishSide(quest: Quest) {
    startTransition(async () => {
      setSideDone(true);
      const xp = await completeSideQuestAction(quest.id);
      if (xp > 0) notify({ title: "Side quest done", detail: `+${xp} XP` });
    });
  }

  return (
    <section aria-labelledby="quests" className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 id="quests" className="text-eyebrow text-muted-foreground">
        Today&apos;s quests
      </h2>

      {daily && (
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint-lavender">
            <Target size={18} />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className={cn("text-sm font-medium", daily.completed && "text-muted-foreground")}>{daily.title}</p>
              <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {daily.completed ? "Done" : `${daily.progress} of ${daily.target}`} · +{daily.xpReward} XP
              </p>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={daily.target}
              aria-valuenow={daily.progress}
              aria-label={daily.title}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-700"
                style={{ width: `${Math.min(100, (daily.progress / Math.max(1, daily.target)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {side && (
        <div className="flex items-center gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint-mint">
            <Compass size={18} />
          </span>
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
            <span className={cn("min-w-0 flex-1 text-sm font-medium", sideDone && "text-muted-foreground line-through")}>
              {side.title}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">+{side.xpReward} XP</span>
            <Checkbox
              checked={sideDone}
              disabled={sideDone}
              onCheckedChange={(checked) => checked === true && finishSide(side)}
              aria-label={`Mark side quest done: ${side.title}`}
            />
          </label>
        </div>
      )}
    </section>
  );
}
