import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InViewRing, RevealGroup, RevealItem } from "./motion-bits";

/* Small, static illustrations for the feature tiles. They are drawn from the same
   tokens and shapes as the real screens, and hidden from assistive tech. */

const DUMPED_TASKS = [
  { title: "Call mom", when: "Sun" },
  { title: "Buy oat milk" },
  { title: "Finish the slides", when: "Thu" },
  { title: "Book dentist" },
];

/** Messy text on the left becomes tidy task chips on the right. */
export function BrainDumpVisual() {
  return (
    <div aria-hidden className="grid w-full items-center gap-4 @md:grid-cols-[1fr_auto_1fr] @md:gap-3">
      <div className="-rotate-1 rounded-2xl bg-card p-4 text-[0.9rem] leading-relaxed text-foreground/80 shadow-soft">
        call mom sunday, need oat milk, slides due thurs!!, dentist (finally)
        <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-brand" />
      </div>

      <ArrowRight className="mx-auto size-5 rotate-90 text-foreground/50 @md:rotate-0" />

      <RevealGroup className="space-y-2" step={0.12} delay={0.1}>
        {DUMPED_TASKS.map((task) => (
          <RevealItem key={task.title} y={12}>
            <div className="flex items-center gap-2.5 rounded-full bg-card py-2 pr-3 pl-2.5 text-sm shadow-soft">
              <span className="size-4 shrink-0 rounded-full border-2 border-input" />
              <span className="font-medium">{task.title}</span>
              {task.when ? (
                <span className="ml-auto rounded-full bg-brand-soft px-2 py-0.5 text-[0.7rem] font-medium text-brand">
                  {task.when}
                </span>
              ) : null}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}

/** One big card, with the rest of the list quietly stacked behind it. */
export function WhatsNextVisual() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-xs pt-8">
      <div className="absolute inset-x-9 top-0 h-24 rounded-3xl border border-border/50 bg-card/45" />
      <div className="absolute inset-x-4 top-4 h-24 rounded-3xl border border-border/60 bg-card/70" />
      <div className="relative rounded-3xl border border-border/70 bg-card p-5 shadow-lift">
        <p className="text-eyebrow">Next up</p>
        <p className="mt-2 font-display text-3xl leading-tight">Reply to Sam</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="brand">Due today</Badge>
          <span className="text-xs text-muted-foreground">5 min</span>
        </div>
        <span className={cn(buttonVariants(), "pointer-events-none mt-5")}>Start</span>
      </div>
    </div>
  );
}

/** A calm timer ring with a single step beneath it. */
export function FocusVisual() {
  return (
    <div
      aria-hidden
      className="mx-auto flex w-full max-w-[16rem] flex-col items-center rounded-3xl bg-card px-6 py-6 shadow-soft"
    >
      <InViewRing fraction={0.5} size={152} stroke={10}>
        <div>
          <p className="font-display text-4xl leading-none tabular-nums">12:30</p>
          <p className="mt-1 text-[0.7rem] text-muted-foreground">left</p>
        </div>
      </InViewRing>
      <p className="mt-4 text-center text-sm font-medium">Draft the first paragraph</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Step 2 of 4</p>
    </div>
  );
}
