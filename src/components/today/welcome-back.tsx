"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { claimComebackAction } from "@/app/(dashboard)/today/actions";
import { Companion } from "@/components/gamification/companion";
import { buttonVariants } from "@/components/ui/button";
import { companionStage } from "@/lib/gamification/rules";

/**
 * Shown when someone returns after time away. The bonus is for coming back,
 * never a penalty for leaving, and it points at one manageable thing to do.
 *
 * Claiming the bonus refreshes the page, which makes `active` flip back to
 * false. The card latches open so it doesn't vanish the moment it appears.
 */
export function WelcomeBack({
  active,
  level,
  suggestion,
}: {
  active: boolean;
  level: number;
  suggestion: { id: string; title: string; minutes: number | null } | null;
}) {
  const [latched, setLatched] = useState(active);
  const [bonus, setBonus] = useState<number | null>(null);
  const claimed = useRef(false);

  if (active && !latched) setLatched(true);

  useEffect(() => {
    if (!active || claimed.current) return;
    claimed.current = true;
    void claimComebackAction().then(setBonus);
  }, [active]);

  if (!latched) return null;

  return (
    <section className="animate-rise relative flex flex-col items-start gap-5 overflow-hidden rounded-[2rem] bg-tint-butter p-6 sm:flex-row sm:items-center sm:p-8">
      <Companion stage={companionStage(level)} mood="cheer" size={92} />
      <div className="flex-1 space-y-1.5">
        <p className="text-eyebrow text-foreground/60">You&apos;re back</p>
        <p className="font-display text-3xl sm:text-4xl">Good to see you.</p>
        <p className="text-sm text-foreground/70">
          {bonus ? `Comeback bonus: +${bonus} XP. ` : ""}
          No catching up needed. Let&apos;s start with one thing.
        </p>
      </div>
      {suggestion && (
        <Link href={`/focus/${suggestion.id}`} className={buttonVariants({ variant: "default", size: "lg" })}>
          {suggestion.title.length > 28 ? `${suggestion.title.slice(0, 26)}…` : suggestion.title}
          {suggestion.minutes ? ` · ${suggestion.minutes} min` : ""}
        </Link>
      )}
    </section>
  );
}
