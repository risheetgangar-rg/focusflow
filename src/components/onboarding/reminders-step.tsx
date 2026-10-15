"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowRight, BellRing, Check } from "lucide-react";
import { LogoMark } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import { isPushSupported, subscribeToPush } from "@/lib/notifications/subscribe";
import { StepHeading } from "./step-heading";

type Status = "idle" | "working" | "on" | "failed";

const subscribeToNothing = () => () => {};

const FALLBACK_ERROR = "We couldn't turn reminders on just now. You can try again later in Settings.";

/** What a reminder looks like, so the benefit is clear before anything is asked of the browser. */
function ReminderPreview() {
  return (
    <div aria-hidden className="max-w-sm -rotate-1 rounded-3xl border border-border/80 bg-card p-4 shadow-lift">
      <div className="flex items-start gap-3">
        <LogoMark className="size-10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">FocusFlow</p>
            <p className="text-xs text-muted-foreground">now</p>
          </div>
          <p className="mt-0.5 text-sm leading-snug text-foreground/85">
            Dentist call in 15 minutes. Want to start with the first step?
          </p>
        </div>
      </div>
    </div>
  );
}

export function RemindersStep({ onNext }: { onNext: () => void }) {
  // The server can't know what this browser supports, so assume yes there and check once on the client.
  const supported = useSyncExternalStore(subscribeToNothing, isPushSupported, () => true);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Nothing is requested until this button is pressed.
  async function enable() {
    setStatus("working");
    setMessage(null);
    try {
      const result = await subscribeToPush();
      if (result.ok) {
        setStatus("on");
      } else {
        setStatus("failed");
        setMessage(result.error ?? FALLBACK_ERROR);
      }
    } catch {
      setStatus("failed");
      setMessage(FALLBACK_ERROR);
    }
  }

  return (
    <div className="space-y-9">
      <StepHeading
        focusOnMount
        title="Want gentle reminders?"
        subtitle="A little nudge shortly before things start, so they don't slip past you. Never spam, and you can turn them off whenever you like."
      />

      <ReminderPreview />

      <div className="space-y-4">
        {status === "on" ? (
          <p role="status" className="flex items-center gap-2.5 text-base font-medium">
            <span className="grid size-6 place-items-center rounded-full bg-brand text-brand-foreground">
              <Check aria-hidden className="size-3.5 stroke-[3]" />
            </span>
            Reminders are on. We&apos;ll keep them gentle.
          </p>
        ) : null}

        {status === "failed" && message ? (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        ) : null}

        {!supported ? (
          <p className="rounded-2xl bg-tint-butter px-4 py-3 text-sm leading-relaxed text-foreground">
            This browser can&apos;t show reminders, so we&apos;ll skip this one. FocusFlow works fine without them.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {supported && status !== "on" ? (
            <Button type="button" size="xl" onClick={enable} disabled={status === "working"}>
              <BellRing aria-hidden />
              {status === "working" ? "Turning on…" : status === "failed" ? "Try again" : "Enable reminders"}
            </Button>
          ) : null}
          {supported && status !== "on" ? (
            <Button type="button" variant="ghost" size="xl" onClick={onNext} disabled={status === "working"}>
              Maybe later
            </Button>
          ) : (
            <Button type="button" size="xl" onClick={onNext}>
              Continue
              <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
