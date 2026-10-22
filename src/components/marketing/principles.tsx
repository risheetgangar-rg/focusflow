import { Reveal } from "@/components/motion/primitives";
import { RevealGroup, RevealItem } from "./motion-bits";

const PRINCIPLES = [
  {
    title: "One thing at a time",
    body: "Your list can be long. Your screen doesn’t have to be.",
  },
  {
    title: "Rewards, not penalties",
    body: "XP and levels only ever go up. No lost streaks, and no scoreboard of what didn’t get done.",
  },
  {
    title: "Gentle by design",
    body: "Soft reminders, calm colours and a rescue plan for when life gets in the way.",
  },
];

export function Principles() {
  return (
    <section className="py-24 sm:py-36">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal inView>
            <p className="text-eyebrow">What we believe</p>
          </Reveal>
          <Reveal inView delay={0.06}>
            <h2 className="mt-5 font-display text-[clamp(3.25rem,9.5vw,8rem)] leading-[0.95] tracking-[-0.035em]">
              Less to manage.
              <br />
              <em className="text-brand">More getting started.</em>
            </h2>
          </Reveal>
          <Reveal inView delay={0.14}>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              A long to-do list feels heavy before you&apos;ve done a single thing. Unstuck keeps that weight off your
              screen and out of your head, so all that&apos;s left is the next small step.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="mt-16 grid gap-x-10 gap-y-10 sm:mt-24 md:grid-cols-3" step={0.1}>
          {PRINCIPLES.map((item) => (
            <RevealItem key={item.title} className="border-t border-border pt-6">
              <h3 className="font-display text-3xl leading-tight">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{item.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
