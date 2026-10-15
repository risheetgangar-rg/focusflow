"use client";

import { useEffect } from "react";
import { animate, m, useInView, useMotionValue, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children in. Use `inView` for content below the fold. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  inView = false,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  inView?: boolean;
  className?: string;
}) {
  const target = { opacity: 1, y: 0 };
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      {...(inView ? { whileInView: target, viewport: { once: true, margin: "-60px" } } : { animate: target })}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

/** Children appear one after another. Wrap each child in <StaggerItem>. */
export function Stagger({
  children,
  className,
  step = 0.07,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
  delay?: number;
}) {
  return (
    <m.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } }}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
    >
      {children}
    </m.div>
  );
}

/** Counts up to `value` the first time it scrolls into view. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (!visible) return;
    const controls = animate(motionValue, value, { duration: 0.9, ease: EASE });
    return () => controls.stop();
  }, [visible, value, motionValue]);

  return (
    <m.span ref={ref} className={cn("tabular-nums", className)}>
      {rounded}
    </m.span>
  );
}

/** A soft pulse behind something that deserves attention. */
export function Pulse({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 animate-breathe rounded-[inherit] bg-brand/10 blur-xl", className)}
    />
  );
}
