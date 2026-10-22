"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Button } from "@/components/ui/button";
import type { Win } from "@/services/win-service";
import { MedalBadge } from "./medal-badge";

/*
 * The happy moment after finishing something: a short "+XP" card with a
 * kind line, and a big medal reveal (like a fitness award) when one unlocks.
 * Anything can trigger it with announceWin(win).
 */

const EVENT = "unstuck:win";

export function announceWin(win: Win | null) {
  if (win) window.dispatchEvent(new CustomEvent<Win>(EVENT, { detail: win }));
}

export function WinLayer() {
  const [win, setWin] = useState<Win | null>(null);
  const [medalIndex, setMedalIndex] = useState(0);

  useEffect(() => {
    const onWin = (e: Event) => {
      setWin((e as CustomEvent<Win>).detail);
      setMedalIndex(0);
    };
    window.addEventListener(EVENT, onWin);
    return () => window.removeEventListener(EVENT, onWin);
  }, []);

  const medal = win?.newMedals[medalIndex] ?? null;

  // The +XP card tidies itself away; a medal waits for a tap.
  useEffect(() => {
    if (!win || medal) return;
    const id = window.setTimeout(() => setWin(null), 5000);
    return () => window.clearTimeout(id);
  }, [win, medal]);

  return (
    <AnimatePresence>
      {win && medal && (
        <m.div
          key={`medal-${medal.code}`}
          role="dialog"
          aria-modal="true"
          aria-label={`New medal: ${medal.name}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-primary/85 px-6 backdrop-blur-sm"
        >
          <m.div
            initial={{ scale: 0.6, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex max-w-sm flex-col items-center text-center text-white"
          >
            <p className="text-eyebrow text-sunny">New medal</p>
            <m.div initial={{ rotate: -20 }} animate={{ rotate: 0 }} transition={{ type: "spring", stiffness: 120, damping: 8 }} className="mt-6">
              <MedalBadge icon={medal.icon} color={medal.color} size="lg" />
            </m.div>
            <p className="mt-6 font-display text-5xl leading-none">{medal.name}</p>
            <p className="mt-3 text-white/80">{medal.how}. You did it.</p>
            <Button variant="outline" size="xl" className="mt-8 w-full" onClick={() => setMedalIndex((i) => i + 1)}>
              Nice!
            </Button>
          </m.div>
        </m.div>
      )}
      {win && !medal && (
        <m.div
          key="xp"
          role="status"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed inset-x-4 bottom-24 z-[80] mx-auto max-w-md rounded-3xl border-2 border-border bg-card p-4 shadow-[0_5px_0_var(--border)] lg:bottom-8"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 animate-duo-pop place-items-center rounded-2xl bg-sunny font-display text-lg text-primary">
              +{win.xpGained}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{win.leveledUp ? `Level up! You're now Level ${win.level}.` : win.cheer}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="shrink-0 font-semibold text-foreground">Lv {win.level}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <m.span
                    className="block h-full rounded-full bg-brand"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(win.fraction * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </span>
                <span className="shrink-0">{win.xp} XP</span>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
