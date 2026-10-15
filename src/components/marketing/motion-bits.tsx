"use client";

import { useRef } from "react";
import { m, useInView } from "motion/react";
import { ProgressRing } from "@/components/motion/progress-ring";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "-80px" } as const;

/** Children (wrapped in <RevealItem>) appear one after another once the group scrolls into view. */
export function RevealGroup({
  children,
  className,
  step = 0.08,
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
      whileInView="show"
      viewport={VIEWPORT}
      variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } }}
    >
      {children}
    </m.div>
  );
}

export function RevealItem({
  children,
  className,
  y = 22,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <m.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </m.div>
  );
}

/** A progress ring that draws itself the first time it is scrolled into view (not at page load). */
export function InViewRing({
  fraction,
  size,
  stroke,
  className,
  children,
}: {
  fraction: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <div ref={ref} className="inline-grid">
      {/* Remounting restarts the ring's draw-in animation at the moment it becomes visible. */}
      <ProgressRing
        key={seen ? "seen" : "unseen"}
        fraction={seen ? fraction : 0}
        size={size}
        stroke={stroke}
        className={className}
      >
        {children}
      </ProgressRing>
    </div>
  );
}

/** A slim bar that fills to `fraction` when it scrolls into view. */
export function GrowBar({
  fraction,
  className,
  trackClassName,
}: {
  fraction: number;
  className?: string;
  trackClassName?: string;
}) {
  const pct = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", trackClassName)}>
      <m.div
        className={cn("h-full rounded-full bg-brand", className)}
        initial={{ width: 0 }}
        whileInView={{ width: pct }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1, ease: EASE, delay: 0.25 }}
      />
    </div>
  );
}
