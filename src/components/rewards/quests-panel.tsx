import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quest, QuestType } from "@/types/gamification";

const QUEST_LABELS: Record<QuestType, string> = {
  daily: "Daily quest",
  side: "Side quest",
  boss: "Boss quest",
  comeback: "Comeback quest",
};

/** Today's quests, read-only here (you tick them off from Today). */
export function QuestsPanel({ quests }: { quests: Quest[] }) {
  return (
    <section
      aria-labelledby="quests-heading"
      className="rounded-[2rem] border border-border/80 bg-card p-6 shadow-soft sm:p-8"
    >
      <h2 id="quests-heading" className="font-display text-3xl">
        Today&apos;s quests
      </h2>

      {quests.length === 0 ? (
        <p className="mt-3 text-muted-foreground">
          Your quests for today show up once you&apos;ve opened{" "}
          <Link href="/today" className="font-medium text-foreground underline underline-offset-4 hover:text-brand">
            Today
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {quests.map((quest) => {
            const percent = quest.target > 0 ? Math.min(100, Math.round((quest.progress / quest.target) * 100)) : 0;
            return (
              <li
                key={quest.id}
                className={cn("rounded-2xl p-4", quest.completed ? "bg-tint-mint" : "bg-muted/60")}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2",
                      quest.completed ? "border-brand bg-brand text-brand-foreground" : "border-input bg-card",
                    )}
                  >
                    {quest.completed && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-eyebrow">{QUEST_LABELS[quest.type]}</p>
                    <p className={cn("mt-0.5 font-medium", quest.completed && "text-foreground/70")}>{quest.title}</p>
                    {quest.description && <p className="mt-0.5 text-sm text-muted-foreground">{quest.description}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">+{quest.xpReward} XP</span>
                </div>

                {quest.target > 1 && (
                  <div className="mt-3 pl-9">
                    <div
                      role="progressbar"
                      aria-label={`${quest.title}: ${quest.progress} of ${quest.target}`}
                      aria-valuemin={0}
                      aria-valuemax={quest.target}
                      aria-valuenow={quest.progress}
                      className="h-2 overflow-hidden rounded-full bg-card"
                    >
                      <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {quest.progress} of {quest.target}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
