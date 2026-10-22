import { Check, Sparkles } from "lucide-react";
import PatternWaves from "@/components/effects/PatternWaves";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Mascot } from "@/components/marketing/mascot";
import { cn } from "@/lib/utils";

export type AuthPanelVariant = "login" | "signup" | "forgot" | "reset";

/** Soft concentric rings, echoing the logo. */
function Rings({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute", className)}>
      <div className="grid size-[44rem] place-items-center rounded-full border border-foreground/10">
        <div className="grid size-[31rem] place-items-center rounded-full border border-foreground/10">
          <div className="grid size-[19rem] place-items-center rounded-full border border-foreground/10">
            <div className="size-[8rem] animate-breathe rounded-full bg-foreground/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ children, className, slow = false }: { children: React.ReactNode; className?: string; slow?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-sm font-medium shadow-soft",
        slow ? "animate-float-slow" : "animate-float",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-lg font-display text-5xl leading-[1.02] tracking-[-0.03em] xl:text-6xl">{children}</p>
  );
}

/**
 * The decorative right-hand side of the auth screens: an inset tinted panel with
 * a big quote. Hidden below `lg`, and from assistive tech (it adds nothing to the form).
 */
function PanelFrame({
  tint,
  eyebrow,
  quote,
  ringsClassName,
  children,
}: {
  tint: string;
  eyebrow: string;
  quote: React.ReactNode;
  ringsClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <aside aria-hidden className="hidden p-3 lg:block">
      <div className="sticky top-3 h-[calc(100dvh-1.5rem)]">
        <div
          className={cn(
            "relative isolate flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-brand-gradient p-10 text-white xl:p-14",
          )}
        >
          {/* Whitish dot waves drifting across the indigo; the cursor ripples them. */}
          <PatternWaves
            className="absolute! inset-0 -z-10"
            preset="silk"
            color="#eef2ff"
            backgroundColor="transparent"
            opacity={0.55}
            fade="edges"
            interactive
            cursorSize={60}
            cursorStrength={0.6}
          />
          <p className="relative text-xs font-medium tracking-[0.14em] text-white/70 uppercase">{eyebrow}</p>
          <div className="relative flex flex-1 items-center justify-center py-8 text-foreground">{children}</div>
          <div className="relative">{quote}</div>
        </div>
      </div>
    </aside>
  );
}

function LoginPanel() {
  return (
    <PanelFrame
      tint="bg-tint-lavender"
      eyebrow="Welcome back"
      quote={
        <Quote>
          You&apos;re back. <em>Let&apos;s pick up where you left off.</em>
        </Quote>
      }
    >
      <div className="relative">
        <div className="w-[19rem] -rotate-3 rounded-3xl bg-card p-6 shadow-lift">
          <p className="text-eyebrow">Next up</p>
          <p className="mt-2 font-display text-4xl leading-tight">Reply to Sam</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="brand">Due today</Badge>
            <span className="text-xs text-muted-foreground">5 min</span>
          </div>
          <span className={cn(buttonVariants(), "mt-5")}>Start</span>
        </div>
        <Mascot stage={2} mood="happy" size={128} className="absolute -top-16 -right-14" />
        <Chip className="absolute -bottom-5 -left-10">
          <Sparkles aria-hidden className="size-4 text-brand" />
          One off the pile!!
        </Chip>
      </div>
    </PanelFrame>
  );
}

const SORTED_TASKS = [
  { title: "Call mom", when: "Sun", rotate: "-rotate-2", offset: "" },
  { title: "Buy oat milk", when: null, rotate: "rotate-1", offset: "ml-10" },
  { title: "Finish the slides", when: "Thu", rotate: "-rotate-1", offset: "ml-3" },
];

function SignupPanel() {
  return (
    <PanelFrame
      tint="bg-tint-peach"
      eyebrow="Free to start"
      ringsClassName="top-[40%]"
      quote={
        <div className="space-y-6">
          <Quote>
            Dump it all out. <em>We&apos;ll sort the rest.</em>
          </Quote>
          <ul className="space-y-2 text-sm text-foreground/75">
            {["Start with a single task", "Skip any step you like", "Nothing here will nag or shame you"].map((line) => (
              <li key={line} className="flex items-center gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-card">
                  <Check aria-hidden className="size-3 stroke-[3] text-brand" />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="relative space-y-3">
        {SORTED_TASKS.map((task) => (
          <div
            key={task.title}
            className={cn(
              "flex w-72 items-center gap-3 rounded-full bg-card py-3 pr-4 pl-3.5 shadow-soft",
              task.rotate,
              task.offset,
            )}
          >
            <span className="size-5 shrink-0 rounded-full border-2 border-input" />
            <span className="font-medium">{task.title}</span>
            {task.when ? (
              <span className="ml-auto rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
                {task.when}
              </span>
            ) : null}
          </div>
        ))}
        <Chip slow className="absolute -top-8 -right-16">
          <Sparkles aria-hidden className="size-4 text-brand" />
          Sorted
        </Chip>
      </div>
    </PanelFrame>
  );
}

function ForgotPanel() {
  return (
    <PanelFrame
      tint="bg-tint-sky"
      eyebrow="No worries"
      quote={
        <Quote>
          It happens to <em>everyone.</em>
        </Quote>
      }
    >
      <div className="relative">
        <Mascot stage={2} mood="sleepy" size={220} />
        {["-top-2 right-2 text-4xl", "-top-12 -right-5 text-3xl [animation-delay:-2s]", "-top-20 -right-12 text-2xl [animation-delay:-4s]"].map(
          (style, index) => (
            <span
              key={style}
              className={cn("absolute animate-float-slow font-display text-foreground/45 italic", style)}
            >
              {index === 0 ? "z" : "Z"}
            </span>
          ),
        )}
      </div>
    </PanelFrame>
  );
}

function ResetPanel() {
  return (
    <PanelFrame
      tint="bg-tint-mint"
      eyebrow="Almost there"
      ringsClassName="top-[44%]"
      quote={
        <Quote>
          A <em>fresh</em> start.
        </Quote>
      }
    >
      <div className="relative">
        <Mascot stage={2} mood="cheer" size={220} />
        <Chip className="absolute top-2 -left-24">
          <Check aria-hidden className="size-4 stroke-[3] text-brand" />
          New password
        </Chip>
        <Chip slow className="absolute -right-20 bottom-6">
          <Sparkles aria-hidden className="size-4 text-brand" />
          You&apos;re set
        </Chip>
      </div>
    </PanelFrame>
  );
}

export function AuthPanel({ variant }: { variant: AuthPanelVariant }) {
  switch (variant) {
    case "login":
      return <LoginPanel />;
    case "signup":
      return <SignupPanel />;
    case "forgot":
      return <ForgotPanel />;
    case "reset":
      return <ResetPanel />;
  }
}
