import Link from "next/link";
import { ArrowRight, EyeOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Shown when the game layer is switched off: nothing to chase, and an easy way back. */
export function RewardsOff() {
  return (
    <div className="mx-auto grid min-h-[60vh] w-full max-w-xl place-items-center text-center">
      <div className="space-y-6">
        <span className="mx-auto grid size-24 place-items-center rounded-full bg-tint-sky">
          <EyeOff size={34} aria-hidden />
        </span>
        <div className="space-y-3">
          <p className="text-eyebrow">Rewards</p>
          <h1 className="font-display text-4xl sm:text-5xl">
            The game layer is <span className="italic">off</span>.
          </h1>
          <p className="mx-auto max-w-sm text-muted-foreground">
            No points, levels or creatures. Just your tasks and habits. You can switch it on whenever you like, and
            nothing you&apos;ve done is lost.
          </p>
        </div>
        <Link href="/settings#game-layer" className={buttonVariants({ variant: "brand", size: "lg" })}>
          Open settings
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </div>
  );
}
