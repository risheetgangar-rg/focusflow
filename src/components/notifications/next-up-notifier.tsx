"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showNextUp } from "@/lib/notifications/local";
import { isPushSupported, subscribeToPush } from "@/lib/notifications/subscribe";
import type { Win } from "@/services/win-service";

const ASKED = "unstuck-asked-reminders";

/** True when opened from the home screen (installed), not in a browser tab. */
function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Keeps the "next up" card in the notification bar in step with the app, and
 * the first time the app is opened from the home screen, asks to turn on
 * reminders before anything else.
 */
export function NextUpNotifier() {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void showNextUp();

    const onWin = (e: Event) => void showNextUp((e as CustomEvent<Win>).detail.next);
    window.addEventListener("unstuck:win", onWin);
    // A ✓ tapped in the notification bar: refresh what's on screen.
    const onMessage = (e: MessageEvent) => e.data?.type === "unstuck:refresh" && router.refresh();
    navigator.serviceWorker?.addEventListener("message", onMessage);

    let asked = true;
    try {
      asked = localStorage.getItem(ASKED) === "yes";
    } catch {
      // Storage blocked: don't nag.
    }
    // Shown once, right after install; a one-off check on first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!asked && isInstalled() && isPushSupported() && Notification.permission === "default") setAsk(true);

    return () => {
      window.removeEventListener("unstuck:win", onWin);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [router]);

  function done() {
    try {
      localStorage.setItem(ASKED, "yes");
    } catch {
      // Fine: worst case we ask once more.
    }
    setAsk(false);
  }

  if (!ask) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Turn on reminders" className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-brand-gradient px-6 text-center text-white">
      <span className="grid size-24 animate-duo-pop place-items-center rounded-full bg-white/15">
        <BellRing size={44} />
      </span>
      <h2 className="font-display text-4xl leading-tight">Turn on reminders?</h2>
      <p className="max-w-sm text-white/85">
        Your next task stays in your notification bar with a ✓ to tick it off, and we&apos;ll nudge you when a reminder is
        due. You can change this any time in Settings.
      </p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button
          size="xl"
          className="bg-sunny text-primary [--btn-shade:#c7a400]"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await subscribeToPush().catch(() => null);
            await showNextUp();
            done();
          }}
        >
          {busy ? "One moment…" : "Turn on reminders"}
        </Button>
        <button type="button" onClick={done} className="text-sm font-medium text-white/80 underline underline-offset-4">
          Not now
        </button>
      </div>
    </div>
  );
}
