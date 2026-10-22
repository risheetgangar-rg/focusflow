import PatternWaves from "@/components/effects/PatternWaves";
import { HeroActions } from "./hero-actions";
import { Orbit } from "./orbit";
import { Rise } from "./rise";

/**
 * Bold, monochrome editorial hero: heavy type up top, then the orbit of
 * poster cards turning beneath it.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-gradient pt-12 text-white sm:pt-20">
      {/* Whitish dot waves drifting over the blue; moving the cursor ripples them, a click drops a splash. */}
      <PatternWaves
        className="absolute! inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_60%,transparent_92%)]"
        preset="silk"
        color="#eef2ff"
        backgroundColor="transparent"
        opacity={0.75}
        fade="center"
        fadeSize={0.6}
        interactive
        cursorSize={60}
        cursorStrength={0.7}
      />
      <div className="mx-auto w-full max-w-[88rem] px-5 text-center sm:px-8">
        <Rise>
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-white/85 uppercase backdrop-blur">
            <span className="size-2 animate-breathe rounded-full bg-lime" />
            Built for brains that start late
          </p>
        </Rise>

        <Rise delay={0.08}>
          <h1 className="mx-auto mt-8 max-w-6xl font-display text-[clamp(3rem,10vw,8.5rem)] leading-[0.95] uppercase">
            <span className="block">
              Get <span className="text-sunny [text-shadow:0_0_40px_rgb(255_224_102/0.45)]">un</span>
              <span className="font-outline text-sunny">stuck.</span>
            </span>
            <span className="mt-2 block font-outline text-[0.55em] text-white/80">One step at a time.</span>
          </h1>
        </Rise>

        <Rise delay={0.16}>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
            Unstuck shows one task at a time. And when you fall off, it brings you back with one tiny win, not a wall of
            old tasks.
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
