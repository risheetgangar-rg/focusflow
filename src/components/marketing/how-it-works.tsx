import { PartyPopper, PenLine, Repeat, Target, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

interface Step {
  title: string;
  body: string;
  icon: LucideIcon;
  tint: string;
}

const STEPS: Step[] = [
  {
    title: "Brain dump",
    body: "Type it, paste it, or say it out loud. Messy is fine. Unstuck pulls out the tasks and the dates for you.",
    icon: PenLine,
    tint: "bg-tint-lavender",
  },
  {
    title: "See what’s next",
    body: "One task, front and centre, with the reason it’s there. The rest of the list can wait its turn.",
    icon: Target,
    tint: "bg-tint-peach",
  },
  {
    title: "Focus",
    body: "Break it into tiny steps, start a calm timer, and just do the first one.",
    icon: Timer,
    tint: "bg-tint-sky",
  },
  {
    title: "Celebrate",
    body: "Mark it done and let it land. Then pick up the next thing, or take a breather. Both count.",
    icon: PartyPopper,
    tint: "bg-tint-butter",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                A gentle loop, <em>not a system.</em>
              </>
            }
            intro="Four small moves you can repeat on a slow morning or a sharp one. There's nothing to set up first."
          />
        </div>

        <div>
          <ol className="divide-y divide-border border-y border-border">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Reveal inView className="grid grid-cols-[4.25rem_1fr] items-start gap-x-5 py-10 sm:grid-cols-[5.5rem_1fr_auto] sm:gap-x-8 sm:py-12">
                  <span aria-hidden className="font-display text-6xl leading-[0.85] text-brand sm:text-7xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-4xl leading-[1.05] sm:text-5xl">
                      <span className="sr-only">Step {index + 1}: </span>
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-md text-lg leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                  <span
                    aria-hidden
                    className={cn("hidden size-14 place-items-center rounded-full text-foreground/80 sm:grid", step.tint)}
                  >
                    <step.icon className="size-6" />
                  </span>
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal inView className="pt-8">
            <p className="flex items-center gap-2.5 text-muted-foreground">
              <Repeat aria-hidden className="size-4" />
              Then it loops back to what&apos;s next. That&apos;s the whole system.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
