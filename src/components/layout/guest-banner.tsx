import Link from "next/link";
import { Sparkles } from "lucide-react";

/** Shown to guests: this is a sample to play with, and the way into your own account. */
export function GuestBanner() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-tint-butter px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <Sparkles size={16} className="mt-0.5 shrink-0" />
        <span>
          You&apos;re trying Unstuck as a guest, with sample tasks to play with. To see the comeback screen again, use the
          &ldquo;pretend I was away&rdquo; button at the bottom of Today.
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-4">
        <Link
          href="/login"
          className="rounded-xl bg-primary px-3.5 py-2 font-semibold text-primary-foreground shadow-[0_3px_0_#0f0066] active:translate-y-[3px] active:shadow-none"
        >
          Log in to my account
        </Link>
        <Link href="/settings" className="font-medium underline underline-offset-4 hover:text-brand">
          Keep these tasks
        </Link>
      </div>
    </div>
  );
}
