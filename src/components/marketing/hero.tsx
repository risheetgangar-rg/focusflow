import { HeroActions } from "./hero-actions";
import { Orbit } from "./orbit";
import { Rise } from "./rise";

/**
 * Bold, monochrome editorial hero: heavy type up top, then the orbit of
 * poster cards turning beneath it.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-muted/60 pt-12 sm:pt-20">
      <div className="mx-auto w-full max-w-[88rem] px-5 text-center sm:px-8">
        <Rise>
          <p className="inline-flex items-center gap-2.5 rounded-full border border-foreground/10 bg-background/70 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-foreground/70 uppercase backdrop-blur">
            <span className="size-2 animate-breathe rounded-full bg-[#f5c518]" />
            Built for brains that start late
          </p>
        </Rise>

        <Rise delay={0.08}>
          <h1 className="mx-auto mt-8 max-w-6xl text-[clamp(3.2rem,10.5vw,8.5rem)] leading-[0.86] font-black tracking-[-0.055em] uppercase">
            <span className="block">Get unstuck.</span>
            <span className="block text-foreground/35">One step at a time.</span>
          </h1>
        </Rise>

        <Rise delay={0.16}>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Dump everything out of your head. FocusFlow shows you the one thing to do next, then makes starting it feel
            easy.
          </p>
        </Rise>

        <Rise delay={0.24} className="mt-10">
          <HeroActions />
        </Rise>
      </div>

      <Rise delay={0.35} className="mt-14 sm:mt-20">
        <Orbit />
      </Rise>
    </section>
  );
}
