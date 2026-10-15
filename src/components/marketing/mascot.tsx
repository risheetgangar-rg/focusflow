import type { ComponentProps } from "react";
import { Companion } from "@/components/gamification/companion";
import { cn } from "@/lib/utils";

/**
 * The companion, as used on public and first-run screens.
 *
 * The companion's glow halo carries a faint `opacity` attribute, but it also uses the
 * `animate-breathe` utility, whose keyframes set their own opacity and so win over the
 * attribute: the halo turns solid and swallows the body. Switching that one animation
 * off here lets the halo stay as faint as it was drawn.
 */
export function Mascot({ className, ...props }: ComponentProps<typeof Companion>) {
  return <Companion {...props} className={cn("[&_circle.animate-breathe]:animate-none", className)} />;
}
