"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/**
 * Loads only the small animation feature set (not the full library) and
 * honors the device's "reduce motion" setting everywhere automatically.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
