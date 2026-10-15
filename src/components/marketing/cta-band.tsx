import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Concentric rings echoing the logo, drawn from the foreground token so they work on any theme. */
function Rings() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 -right-40 hidden -translate-y-1/2 sm:block lg:-right-20"
    >
      <div className="grid size-[34rem] place-items-center rounded-full border border-primary-foreground/10">
        <div className="grid size-[23rem] place-items-center rounded-full border border-primary-foreground/10">
          <div className="grid size-[12rem] place-items-center rounded-full border border-primary-foreground/15">
            <div className="size-5 animate-breathe rounded-full bg-primary-foreground/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CtaBand() {
  return (
    <section className="px-3 pb-4 sm:px-6 sm:pb-6">
      <div className="bg-grain relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-primary px-7 py-20 text-primary-foreground sm:px-16 sm:py-28">
        <Rings />

        <div className="relative max-w-2xl">
          <Reveal inView>
            <h2 className="font-display text-[clamp(3.5rem,10vw,7.5rem)] leading-[0.94] tracking-[-0.035em]">
              Ready when <em>you are.</em>
            </h2>
          </Reveal>
          <Reveal inView delay={0.1}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-primary-foreground/75 sm:text-xl">
              Start with one task. That&apos;s enough for today.
            </p>
          </Reveal>
          <Reveal inView delay={0.18}>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "xl" }),
                  "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
                )}
              >
                Start free
                <ArrowRight aria-hidden />
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-primary-foreground/75 underline underline-offset-4 transition-colors hover:text-primary-foreground"
              >
                I already have an account
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
