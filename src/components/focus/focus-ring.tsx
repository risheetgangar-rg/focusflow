import { cn } from "@/lib/utils";

const SIZE = 320;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The big ring at the heart of Focus Mode. With a timer it's a calm countdown
 * (the colored arc shrinks as time passes); without one it simply breathes, so
 * there's something gentle to look at and nothing to race.
 */
export function FocusRing({
  fraction,
  countdown,
  paused,
  children,
}: {
  /** Share of the countdown still left, 0 to 1. Ignored without a countdown. */
  fraction: number;
  countdown: boolean;
  paused: boolean;
  children: React.ReactNode;
}) {
  const left = Math.min(1, Math.max(0, fraction));
  const offset = CIRCUMFERENCE * (1 - left);
  const sweep = "transition-[stroke-dashoffset] duration-1000 ease-linear";

  return (
    <div
      className={cn(
        "relative grid size-[min(17.5rem,40dvh)] place-items-center sm:size-[min(20rem,44dvh)]",
        !countdown && "animate-breathe",
        paused && "[animation-play-state:paused]",
      )}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden className="absolute inset-0 size-full -rotate-90 overflow-visible">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-foreground/10" />
        {countdown ? (
          <>
            {/* a faint glow under the arc */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              opacity={left > 0 ? 1 : 0}
              className={cn("stroke-brand/30 blur-md", sweep)}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              opacity={left > 0 ? 1 : 0}
              className={cn("stroke-brand", sweep)}
            />
          </>
        ) : (
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-brand/40" />
        )}
      </svg>
      <div className="relative z-10 flex flex-col items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * The time, with every digit in a fixed-width cell so the numbers never
 * jitter as they change (serif digits aren't all the same width).
 */
export function TimeDisplay({ text, spoken }: { text: string; spoken: string }) {
  return (
    <span role="timer" aria-label={spoken} className={cn("font-display leading-none", text.length > 5 ? "text-5xl" : "text-6xl")}>
      <span aria-hidden className="inline-flex justify-center">
        {Array.from(text).map((char, i) => (
          <span key={i} className={cn("inline-block text-center", char === ":" ? "w-[0.3em]" : "w-[0.55em]")}>
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
