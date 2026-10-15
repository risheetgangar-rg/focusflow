import { Reveal } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";

/** Eyebrow + big serif title + optional intro, revealed as it scrolls into view. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "start",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered && "mx-auto text-center", className)}>
      <Reveal inView>
        <p className="text-eyebrow">{eyebrow}</p>
      </Reveal>
      <Reveal inView delay={0.06}>
        <h2 className="mt-4 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">{title}</h2>
      </Reveal>
      {intro ? (
        <Reveal inView delay={0.12}>
          <p className={cn("mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground", centered && "mx-auto")}>
            {intro}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
