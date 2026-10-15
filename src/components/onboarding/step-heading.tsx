"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The big serif title for a step. When `focusOnMount` is set, keyboard and screen-reader focus
 * moves here as the step appears, so a change of step is announced and Tab continues from the top.
 */
export function StepHeading({
  title,
  subtitle,
  focusOnMount = false,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  focusOnMount?: boolean;
  className?: string;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  return (
    <div className={cn("space-y-4", className)}>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-[clamp(2.75rem,9vw,4.75rem)] leading-[1.02] tracking-[-0.03em] outline-none"
      >
        {title}
      </h1>
      {subtitle ? <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
