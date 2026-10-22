import Link from "next/link";
import { Sparkles } from "lucide-react";

/** Shown to guests: this is a sample to play with, here's the best thing to try, and how to keep it. */
export function GuestBanner() {
  return (
    <div className="mb-6 flex flex-col gap-2 rounded-2xl bg-tint-butter px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <Sparkles size={16} className="mt-0.5 shrink-0" />
        <span>
          You&apos;re trying Unstuck as a guest, with a sample list to play with. To see the comeback screen, scroll to the
          bottom of Today and tap <strong>&ldquo;pretend I was away 4 days&rdquo;</strong>.
        </span>
      </p>
      <Link href="/settings" className="shrink-0 font-medium underline underline-offset-4 hover:text-brand">
        Keep my stuff
      </Link>
    </div>
  );
}
