import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Unstuck on a phone" };

/**
 * A demo page for screen recordings: the live app inside a phone frame, so a
 * desktop recording shows the mobile experience. Same site, so signing in,
 * guest mode and the mic all work inside it.
 */
export default function PhonePreviewPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center gap-16 bg-brand-gradient px-6 py-8">
      <div className="hidden max-w-sm text-white lg:block">
        <Image src="/logo-unstuck.png" alt="Unstuck" width={1664} height={719} className="h-auto w-64" priority />
        <p className="mt-6 font-display text-4xl leading-tight uppercase">Built for brains that start late.</p>
        <p className="mt-4 text-lg text-white/80">One task at a time, and a gentle way back after a bad week.</p>
      </div>

      {/* The phone: a dark bezel with rounded corners and a notch, the real app inside. */}
      <div
        className="relative shrink-0 rounded-[3.25rem] bg-[#0d0b2b] p-3 shadow-[0_30px_80px_rgba(10,0,60,0.55)]"
        style={{ height: "min(868px, calc(100dvh - 64px))", aspectRatio: "414 / 868" }}
      >
        <div className="absolute top-3 left-1/2 z-10 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-[#0d0b2b]" aria-hidden />
        <iframe
          src="/"
          title="Unstuck app"
          allow="microphone; clipboard-write"
          className="size-full rounded-[2.5rem] bg-white"
        />
      </div>
    </main>
  );
}
