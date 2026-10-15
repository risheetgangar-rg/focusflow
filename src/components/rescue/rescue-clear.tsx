import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { Companion } from "@/components/gamification/companion";
import { buttonVariants } from "@/components/ui/button";

/** The good news screen: nothing is piling up. */
export function RescueClear({ showCompanion }: { showCompanion: boolean }) {
  return (
    <div className="mx-auto grid min-h-[65vh] w-full max-w-xl place-items-center text-center">
      <div className="space-y-6">
        <div className="grid place-items-center">
          {showCompanion ? (
            <Companion stage={1} mood="sleepy" size={140} />
          ) : (
            <span className="grid size-24 place-items-center rounded-full bg-tint-sky">
              <LifeBuoy size={36} aria-hidden />
            </span>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-eyebrow">Rescue</p>
          <h1 className="font-display text-4xl sm:text-5xl">No rescue needed.</h1>
          <p className="mx-auto max-w-sm text-muted-foreground">
            Nothing is piling up. Enjoy the calm, or pick one small thing when you feel like it.
          </p>
        </div>
        <Link href="/today" className={buttonVariants({ variant: "brand", size: "lg" })}>
          Back to Today
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </div>
  );
}
