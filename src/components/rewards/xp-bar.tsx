"use client";

import { m } from "motion/react";

/** A fat, friendly progress bar that fills in once on arrival. */
export function XpBar({ fraction, label }: { fraction: number; label: string }) {
  const percent = Math.round(Math.max(0, Math.min(1, fraction)) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-3.5 w-full overflow-hidden rounded-full bg-card/70"
    >
      <m.div
        className="h-full rounded-full bg-brand"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
