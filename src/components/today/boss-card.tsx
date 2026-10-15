import Link from "next/link";
import { ArrowRight, Swords } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { bossStatus } from "@/lib/tasks/boss";
import type { Subtask, Task } from "@/types/task";

/**
 * A "boss" is a big, scary task cut into phases. Each finished step chips away
 * at its HP, so the thing that felt impossible becomes a series of small wins.
 */
export function BossCard({ task, steps }: { task: Task; steps: Subtask[] }) {
  const status = bossStatus(steps);
  const next = steps.find((s) => !s.completed);

  return (
    <section
      aria-labelledby="boss"
      className="relative overflow-hidden rounded-3xl border border-border bg-tint-rose p-5 shadow-soft sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card/70">
          <Swords size={20} />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 id="boss" className="text-eyebrow text-foreground/60">
              Boss task
            </h2>
            <p className="font-display text-2xl leading-tight sm:text-3xl">{task.title}</p>
          </div>

          <div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={status.hp}
              aria-label="Boss health"
              className="h-2 overflow-hidden rounded-full bg-card/60"
            >
              <div className="h-full rounded-full bg-destructive transition-[width] duration-700" style={{ width: `${status.hp}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-foreground/70">
              {status.total === 0
                ? "Add a few phases to start chipping away."
                : `${status.remaining} of ${status.total} phases left`}
            </p>
          </div>

          <Link
            href={`/focus/${task.id}`}
            className={buttonVariants({ variant: "default", size: "default" })}
          >
            {next ? `Next: ${next.title.length > 30 ? `${next.title.slice(0, 28)}…` : next.title}` : "Take a swing"}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
