import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitCompletionStatus } from "@/types/habit";

export type DayStatus = HabitCompletionStatus | undefined;

/** Neutral wording for every state. A day with nothing on it is just "Not yet". */
export const STATUS_TEXT: Record<HabitCompletionStatus | "none", string> = {
  completed: "Done",
  partial: "Partly done",
  skipped: "Skipped",
  none: "Not yet",
};

/**
 * One day's mark. Each state has its own shape as well as its own look, so it
 * never relies on color alone: filled check, half-filled circle, dash, empty ring.
 */
function DayMark({ status, future, pop }: { status: DayStatus; future: boolean; pop: boolean }) {
  const base = "grid size-9 place-items-center rounded-full";
  const popClass = pop && "animate-pop";

  if (status === "completed") {
    return (
      <span className={cn(base, "bg-brand text-brand-foreground shadow-[0_8px_16px_-8px_var(--brand)]", popClass)}>
        <Check className="size-[1.125rem]" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span
        className={cn(base, "border-2 border-brand bg-[linear-gradient(90deg,var(--brand)_50%,transparent_50%)]", popClass)}
      />
    );
  }
  if (status === "skipped") {
    return (
      <span className={cn(base, "bg-muted text-muted-foreground", popClass)}>
        <Minus className="size-[1.125rem]" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={cn(
        base,
        "border-2 text-brand",
        future ? "border-dashed border-border" : "border-input group-hover/day:border-brand/60",
      )}
    >
      {!future && (
        <Check
          className="size-[1.125rem] opacity-0 transition-opacity group-hover/day:opacity-40"
          strokeWidth={3}
          aria-hidden
        />
      )}
    </span>
  );
}

/** A tall, easy-to-hit day column: the letter on top, the state mark underneath. */
export function DayButton({
  letter,
  weekday,
  dateLabel,
  status,
  isToday,
  isFuture,
  pop,
  onCycle,
}: {
  letter: string;
  weekday: string;
  dateLabel: string;
  status: DayStatus;
  isToday: boolean;
  isFuture: boolean;
  /** Play the little pop animation (only after the person taps, never on page load). */
  pop: boolean;
  onCycle: () => void;
}) {
  const text = STATUS_TEXT[status ?? "none"];

  return (
    <button
      type="button"
      onClick={onCycle}
      disabled={isFuture}
      aria-label={`${weekday}: ${isFuture ? "coming up" : text}${isToday ? ", today" : ""}`}
      title={isFuture ? `${dateLabel} · Coming up` : `${dateLabel} · ${text}. Tap to change.`}
      className="group/day flex flex-col items-center gap-1.5 rounded-2xl px-0 py-2 transition-colors enabled:hover:bg-muted disabled:cursor-default disabled:opacity-60"
    >
      <span
        aria-hidden
        className={cn(
          "text-[0.7rem] font-medium tracking-wide text-muted-foreground",
          isToday && "font-semibold text-foreground",
        )}
      >
        {letter}
      </span>
      <span
        className={cn(
          "rounded-full transition-shadow duration-200",
          isToday && "shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--brand)]",
        )}
      >
        <DayMark key={status ?? "none"} status={status} future={isFuture} pop={pop} />
      </span>
    </button>
  );
}
