import { ArrowRight, Check } from "lucide-react";
import { companionStage, levelProgress } from "@/lib/gamification/rules";
import { cn } from "@/lib/utils";
import { Mascot } from "./mascot";
import { GrowBar, RevealGroup, RevealItem } from "./motion-bits";

/* Illustrations for the care-focused feature tiles: Rescue, Habits, Rewards. */

const RESCUE_ROWS = [
  { title: "Pay the electricity bill", note: "Start here", primary: true },
  { title: "Reply to Dana", note: "Tomorrow", primary: false },
  { title: "Fold the laundry", note: "Tomorrow", primary: false },
];

/** The gentle reset: one thing now, everything else moved without fuss. */
export function RescueVisual() {
  return (
    <div aria-hidden className="relative w-full max-w-md">
      <div className="pointer-events-none absolute -inset-4 -z-10 animate-breathe rounded-[2.5rem] bg-card/50 blur-2xl" />
      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <p className="text-eyebrow">Rescue</p>
        <p className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl">
          Let&apos;s start with <em>one thing.</em>
        </p>
        <ul className="mt-5 space-y-2">
          {RESCUE_ROWS.map((row) => (
            <li
              key={row.title}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm",
                row.primary ? "bg-brand-soft font-medium" : "bg-muted/70 text-foreground/70",
              )}
            >
              {row.primary ? null : <ArrowRight className="size-3.5 shrink-0 text-foreground/50" />}
              <span className="min-w-0 flex-1 truncate">{row.title}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium",
                  row.primary ? "bg-brand text-brand-foreground" : "bg-tint-sky text-foreground/80",
                )}
              >
                {row.note}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type DotState = "done" | "partial" | "off";

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const HABITS: { name: string; goal: string; week: DotState[]; summary: string; complete: boolean }[] = [
  {
    name: "Stretch",
    goal: "3 days a week",
    week: ["done", "off", "done", "off", "done", "off", "off"],
    summary: "3 of 3 this week",
    complete: true,
  },
  {
    name: "Read",
    goal: "4 days a week",
    week: ["done", "partial", "off", "done", "off", "off", "off"],
    summary: "2 of 4 so far, plenty of week left",
    complete: false,
  },
];

function Dot({ state }: { state: DotState }) {
  return (
    <span
      className={cn(
        "grid size-7 place-items-center rounded-full border-2 text-brand-foreground",
        state === "done" && "border-brand bg-brand",
        state === "partial" && "border-brand [background:linear-gradient(90deg,var(--brand)_50%,transparent_50%)]",
        state === "off" && "border-input",
      )}
    >
      {state === "done" ? <Check className="size-3.5 stroke-[3]" /> : null}
    </span>
  );
}

/** Weekly goals with flexible days: nothing to break. */
export function HabitsVisual() {
  return (
    <div aria-hidden className="w-full">
      <RevealGroup className="grid gap-3 @md:grid-cols-2" step={0.12} delay={0.05}>
        {HABITS.map((habit) => (
          <RevealItem key={habit.name} y={14}>
            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{habit.name}</p>
                <p className="text-xs text-muted-foreground">{habit.goal}</p>
              </div>
              <div className="mt-3 grid grid-cols-7 justify-items-center gap-1">
                {habit.week.map((state, index) => (
                  <div key={index} className="flex flex-col items-center gap-1.5">
                    <span className="text-[0.65rem] text-muted-foreground">{WEEK_LETTERS[index]}</span>
                    <Dot state={state} />
                  </div>
                ))}
              </div>
              <p
                className={cn(
                  "mt-3 flex items-center gap-1.5 text-xs font-medium",
                  habit.complete ? "text-brand" : "text-muted-foreground",
                )}
              >
                {habit.complete ? <Check className="size-3.5 stroke-[3]" /> : null}
                {habit.summary}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}

const SAMPLE_XP = 480;

/** XP, a level title and the companion, using the app's real level maths. */
export function RewardsVisual() {
  const progress = levelProgress(SAMPLE_XP);

  return (
    <div aria-hidden className="relative w-full rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow">Level {progress.level}</p>
          <p className="mt-1 font-display text-3xl leading-tight">{progress.title}</p>
        </div>
        <Mascot stage={companionStage(progress.level)} mood="cheer" size={92} className="-mt-3 -mr-1 shrink-0" />
      </div>

      <div className="mt-3">
        <GrowBar fraction={progress.fraction} />
        <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">
            {progress.xpIntoLevel} / {progress.xpForNextLevel} XP
          </span>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-medium text-brand">+25 XP</span>
        </div>
      </div>
    </div>
  );
}
