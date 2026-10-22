import { cn } from "@/lib/utils";

/*
 * The hero "orbit": tall poster cards riding a slowly turning wheel, stepping
 * from slot to slot like a carousel (after the Jitter "Orbit" reference).
 * Pure CSS, so it renders on the server and costs no JavaScript. The card
 * faces are fixed art (posters), so they keep their colors in every theme.
 */

const KINETIC_WORDS = ["START", "NOW", "ONE", "THING", "FOCUS", "FLOW"];

function Kinetic() {
  const column = (
    <div className="flex flex-col items-center leading-[0.86]">
      {KINETIC_WORDS.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </div>
  );
  return (
    <div className="h-full bg-[linear-gradient(180deg,#d9dadf,#c3c5ca)] text-[#0b0b0c]">
      <div className="animate-[type-scroll_9s_linear_infinite] text-center text-[calc(var(--card-w)*0.27)] font-black tracking-[-0.04em]">
        {column}
        {column}
      </div>
    </div>
  );
}

function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="50" cy="50" r="4.5" fill="#f5c518" />
    </svg>
  );
}

function LogoCard() {
  return (
    <div className="grid h-full place-items-center bg-[#0b0b0c] text-[#f4f4f2]">
      <Rings className="w-[46%]" />
      <span className="absolute bottom-[8%] text-[calc(var(--card-w)*0.06)] font-semibold tracking-[0.3em]">UNSTUCK</span>
    </div>
  );
}

function DumpCard() {
  return (
    <div className="relative h-full overflow-hidden bg-[#f5c518] text-[#0b0b0c]">
      <span className="absolute top-[4%] -left-[6%] origin-top-left translate-x-[calc(var(--card-w)*0.95)] rotate-90 text-[calc(var(--card-w)*0.44)] leading-none font-black tracking-[-0.05em] whitespace-nowrap">
        dump it.
      </span>
      <span className="absolute -right-[18%] -bottom-[10%] aspect-square w-[60%] rotate-12 rounded-[18%] bg-[#2f6bff]" />
    </div>
  );
}

function SphereCard() {
  return (
    <div className="relative h-full overflow-hidden bg-[#0b0b0c]">
      <div className="absolute -top-[30%] -left-[40%] aspect-square w-[150%] rounded-full bg-[radial-gradient(circle_at_70%_65%,#3a3a3f,#0b0b0c_62%)]" />
      <div className="absolute top-[38%] -right-[50%] aspect-square w-[120%] rounded-full border-[calc(var(--card-w)*0.012)] border-white/20" />
      <div className="absolute top-[46%] left-[30%] aspect-square w-[24%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f2f2f2,#7d7d82_45%,#1c1c1f_80%)] shadow-[0_8px_30px_rgb(0_0_0/0.6)]" />
      <span className="absolute bottom-[7%] left-[9%] text-[calc(var(--card-w)*0.075)] font-semibold tracking-[0.2em] text-white/70">FOCUS</span>
    </div>
  );
}

function TimerCard() {
  return (
    <div className="grid h-full place-items-center bg-[linear-gradient(160deg,#ffffff,#e4e5e9)] text-[#0b0b0c]">
      <div className="relative grid aspect-square w-[78%] place-items-center rounded-full border-[calc(var(--card-w)*0.03)] border-[#0b0b0c] shadow-[inset_0_0_0_calc(var(--card-w)*0.025)_#fff,inset_0_0_0_calc(var(--card-w)*0.032)_#0b0b0c]">
        <span className="text-[calc(var(--card-w)*0.2)] font-black tracking-[-0.05em] tabular-nums">25:00</span>
      </div>
    </div>
  );
}

function NextCard() {
  return (
    <div className="flex h-full flex-col justify-between bg-[#f4f4f2] p-[9%] text-[#0b0b0c]">
      <span className="text-[calc(var(--card-w)*0.055)] font-semibold tracking-[0.25em] text-[#0b0b0c]/50">WHAT&apos;S NEXT</span>
      <span className="text-[calc(var(--card-w)*0.17)] leading-[0.95] font-black tracking-[-0.04em]">
        Call
        <br />
        Rahul.
      </span>
      <span className="inline-flex w-fit items-center gap-[0.4em] rounded-full bg-[#0b0b0c] px-[0.9em] py-[0.45em] text-[calc(var(--card-w)*0.07)] font-semibold text-white">
        Start <span aria-hidden>→</span>
      </span>
    </div>
  );
}

function HabitCard() {
  const filled = [1, 1, 0, 1, 1, 0, 0];
  return (
    <div className="flex h-full flex-col justify-between bg-[#0b0b0c] p-[9%] text-white">
      <span className="text-[calc(var(--card-w)*0.055)] font-semibold tracking-[0.25em] text-white/50">HABITS</span>
      <div className="grid grid-cols-7 gap-[6%]">
        {filled.map((on, i) => (
          <span key={i} className={cn("aspect-square rounded-full", on ? "bg-[#f5c518]" : "bg-white/15")} />
        ))}
      </div>
      <span className="text-[calc(var(--card-w)*0.2)] leading-none font-black tracking-[-0.05em]">
        4<span className="text-white/40">/5</span>
      </span>
    </div>
  );
}

function XpCard() {
  return (
    <div className="flex h-full flex-col items-start justify-end bg-[linear-gradient(200deg,#e9eaee,#a9abb2)] p-[9%] text-[#0b0b0c]">
      <span className="text-[calc(var(--card-w)*0.3)] leading-[0.85] font-black tracking-[-0.06em]">+120</span>
      <span className="mt-[4%] text-[calc(var(--card-w)*0.07)] font-semibold tracking-[0.3em]">XP · NICE WORK</span>
    </div>
  );
}

function BreatheCard() {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-[#1a1a1d] text-white">
      <div className="absolute aspect-square w-[90%] animate-breathe rounded-full bg-[radial-gradient(circle,#5c5c63,transparent_65%)]" />
      <span className="relative font-display text-[calc(var(--card-w)*0.2)] italic">Breathe.</span>
    </div>
  );
}

const FACES = [Kinetic, LogoCard, DumpCard, SphereCard, TimerCard, NextCard, HabitCard, XpCard, BreatheCard];
const SLOTS = FACES.length * 2;
const STEP = 360 / SLOTS;
/** Seconds each card rests before the wheel turns one slot. */
const HOLD = 2.2;
const MOVE = 0.9;

/** Keyframes that turn the wheel one slot at a time: ease into place, rest, repeat. */
function stepKeyframes(): string {
  const total = SLOTS * (HOLD + MOVE);
  const frames: string[] = [];
  for (let i = 0; i < SLOTS; i++) {
    const start = (i * (HOLD + MOVE)) / total;
    const moveFrom = start + HOLD / total;
    frames.push(`${(start * 100).toFixed(3)}% { transform: rotate(${(i * STEP).toFixed(3)}deg); }`);
    frames.push(
      `${(moveFrom * 100).toFixed(3)}% { transform: rotate(${(i * STEP).toFixed(3)}deg); animation-timing-function: cubic-bezier(0.65, 0, 0.25, 1); }`,
    );
  }
  frames.push(`100% { transform: rotate(360deg); }`);
  return `@keyframes orbit-step { ${frames.join(" ")} } .orbit-wheel { animation: orbit-step ${total}s linear infinite; }`;
}

export function Orbit({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "orbit relative isolate mx-auto w-full overflow-hidden select-none",
        "[--card-w:clamp(128px,19vw,250px)] [--card-h:calc(var(--card-w)*1.6)] [--r:calc(var(--card-w)*3.55)]",
        "h-[calc(var(--card-h)*1.18+2.5rem)]",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: stepKeyframes() }} />

      {/* The wheel's center sits far below the stage, so only the top of the circle shows. */}
      <div className="orbit-wheel absolute top-[calc(2.5rem+var(--card-h)/2+var(--r))] left-1/2 size-0">
        {Array.from({ length: SLOTS }, (_, i) => {
          const Face = FACES[i % FACES.length];
          return (
            <div
              key={i}
              className="absolute top-[calc(var(--card-h)/-2)] left-[calc(var(--card-w)/-2)] h-(--card-h) w-(--card-w) overflow-hidden rounded-[calc(var(--card-w)*0.07)] shadow-[0_24px_50px_-24px_rgb(0_0_0/0.55)]"
              style={{ transform: `rotate(${-i * STEP}deg) translateY(calc(var(--r) * -1))` }}
            >
              <Face />
            </div>
          );
        })}
      </div>

      {/* The hub: a soft gray disc in front of the cards' lower edges, like the reference. */}
      <div className="pointer-events-none absolute top-[calc(2.5rem+var(--card-h)*0.96)] left-1/2 aspect-square w-[calc((var(--r)-var(--card-h)*0.46)*2)] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#cfd1d6,#e2e3e7_10%,var(--background)_22%)] shadow-[0_-12px_40px_-20px_rgb(0_0_0/0.35)]" />
      {/* Melt the bottom edge into the page instead of a hard line. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
