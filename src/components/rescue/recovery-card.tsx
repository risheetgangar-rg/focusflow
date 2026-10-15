import { CalendarClock, Clock } from "lucide-react";
import { describeDue } from "@/lib/dates/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

const CHIP = "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-foreground/75";

/**
 * One task in the three-task recovery plan. The first is larger and tinted,
 * because it's the only one that matters right now. Due dates are stated
 * plainly ("Was due yesterday"), never as an alarm.
 */
export function RecoveryCard({
  task,
  index,
  now,
  timezone,
}: {
  task: Task;
  index: number;
  now: Date;
  timezone: string;
}) {
  const first = index === 0;
  const due = task.dueAt ? describeDue(task.dueAt, now, timezone) : null;

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-3xl p-5 shadow-soft sm:gap-6 sm:p-7",
        first ? "bg-brand-soft ring-1 ring-brand/25" : "border border-border/80 bg-card",
      )}
    >
      <span
        aria-hidden
        className={cn("font-display leading-none", first ? "text-6xl text-brand" : "text-5xl text-muted-foreground/60")}
      >
        {index + 1}
      </span>

      <div className="min-w-0 flex-1 pt-1">
        {first && <p className="text-eyebrow">Start here</p>}
        <h2
          className={cn(
            "break-words",
            first ? "mt-1 font-display text-3xl leading-tight sm:text-4xl" : "text-lg font-medium sm:text-xl",
          )}
        >
          <span className="sr-only">{index + 1}. </span>
          {task.title}
        </h2>

        {(task.estimatedMinutes || due) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {task.estimatedMinutes ? (
              <span className={cn(CHIP, first ? "bg-card/70" : "bg-muted")}>
                <Clock className="size-3.5" aria-hidden />
                {task.estimatedMinutes} min
              </span>
            ) : null}
            {due && (
              <span className={cn(CHIP, due.tone === "past" ? "bg-tint-peach" : first ? "bg-card/70" : "bg-muted")}>
                <CalendarClock className="size-3.5" aria-hidden />
                {due.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
