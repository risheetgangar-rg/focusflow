import { cn } from "@/lib/utils";
import type { HabitCompletionStatus } from "@/types/habit";
import { shortDateLabel } from "./habit-dates";
import { STATUS_TEXT } from "./habit-day-button";

type StatusMap = Record<string, HabitCompletionStatus | undefined>;

const CELL = "block shrink-0 rounded-[4px]";

/** Same shape language as the day buttons: solid, half, dashed, empty. */
const FILL = {
  completed: "bg-brand",
  partial: "bg-[linear-gradient(90deg,var(--brand)_50%,var(--muted)_50%)]",
  skipped: "border border-dashed border-muted-foreground/60",
  none: "bg-muted",
  quiet: "bg-muted/40",
} as const;

/**
 * Five weeks at a glance: 35 small squares, one row per week (Monday first),
 * oldest at the top. Quiet by design: empty days are just soft squares.
 */
export function HabitHeatmap({
  dates,
  statusByDate,
  today,
  startedOn,
}: {
  /** Monday-first dates, oldest first (35 of them). */
  dates: string[];
  statusByDate: StatusMap;
  today?: string;
  /** The day the habit was created, in the person's timezone. Earlier squares stay extra quiet. */
  startedOn?: string;
}) {
  const done = dates.filter((d) => statusByDate[d] === "completed" || statusByDate[d] === "partial").length;

  return (
    <div className="flex items-center gap-5">
      <div
        role="img"
        aria-label={`Past five weeks: ${done} ${done === 1 ? "day" : "days"} done`}
        className="grid shrink-0 grid-cols-7 gap-1"
      >
        {dates.map((date) => {
          const status = statusByDate[date];
          const isFuture = today ? date > today : false;
          const isBefore = startedOn ? date < startedOn : false;
          const kind = status ?? (isFuture || isBefore ? "quiet" : "none");
          const text = status
            ? STATUS_TEXT[status]
            : isFuture
              ? "Coming up"
              : isBefore
                ? "Before you started"
                : STATUS_TEXT.none;

          return (
            <span
              key={date}
              title={`${shortDateLabel(date)} · ${text}`}
              className={cn(CELL, "size-3.5", FILL[kind], date === today && "outline-2 outline-offset-1 outline-foreground/40")}
            />
          );
        })}
      </div>

      <div className="min-w-0">
        <p className="text-eyebrow">Past 5 weeks</p>
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-display text-3xl leading-none">{done}</span>
          <span className="text-sm text-muted-foreground">{done === 1 ? "day" : "days"}</span>
        </p>
        <ul aria-hidden className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
          {(
            [
              ["completed", "Done"],
              ["partial", "Partly"],
              ["skipped", "Skipped"],
            ] as const
          ).map(([kind, label]) => (
            <li key={kind} className="flex items-center gap-1.5">
              <span className={cn(CELL, "size-2.5 rounded-[3px]", FILL[kind])} />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
