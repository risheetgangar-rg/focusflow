"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { Bell, Check } from "lucide-react";
import {
  updateNotificationPrefsAction,
  type NotificationPrefsState,
} from "@/app/(dashboard)/settings/notification-actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/notifications/subscribe";
import type { NotificationPreferences } from "@/types/reminder";

type PrefsState = NotificationPrefsState & { savedKey?: string };
type ToggleName = "notifyTaskReminders" | "notifyHabitReminders" | "notifyDeadlineReminders" | "notifyRescueReminders";

const TOGGLES: { name: ToggleName; title: string; hint: string }[] = [
  { name: "notifyTaskReminders", title: "Tasks", hint: "A nudge shortly before something you planned." },
  { name: "notifyHabitReminders", title: "Habits", hint: "At the time you picked for each habit." },
  { name: "notifyDeadlineReminders", title: "Deadlines", hint: "When something important is getting close." },
  { name: "notifyRescueReminders", title: "Getting back on track", hint: "A gentle check-in if things have piled up." },
];

// Browser-only facts (is push available? what did the person already allow?) can't be known on the
// server, so they read as "unknown" (null) until the page is live in the browser.
const subscribeNoop = () => () => {};

function usePushSupport(): boolean | null {
  return useSyncExternalStore(subscribeNoop, isPushSupported, () => null);
}

function useNotificationPermission(): NotificationPermission | "unsupported" | null {
  return useSyncExternalStore(
    subscribeNoop,
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    () => null,
  );
}

/** Why reminders help, one button to turn them on (the browser's permission prompt only appears after that click), then what to be reminded about. */
export function NotificationSettings({ prefs }: { prefs: NotificationPreferences }) {
  const { notify } = useCelebration();
  const supported = usePushSupport();
  const permission = useNotificationPermission();

  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [enabling, setEnabling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [toggles, setToggles] = useState<Record<ToggleName, boolean>>({
    notifyTaskReminders: prefs.notifyTaskReminders,
    notifyHabitReminders: prefs.notifyHabitReminders,
    notifyDeadlineReminders: prefs.notifyDeadlineReminders,
    notifyRescueReminders: prefs.notifyRescueReminders,
  });
  const [quietStart, setQuietStart] = useState(prefs.quietHoursStart?.slice(0, 5) ?? "");
  const [quietEnd, setQuietEnd] = useState(prefs.quietHoursEnd?.slice(0, 5) ?? "");

  // Peek (read-only, no prompt) at whether this browser is already subscribed.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription() ?? null)
      .then((subscription) => {
        if (!cancelled) setSubscribed(Boolean(subscription));
      })
      .catch(() => {
        if (!cancelled) setSubscribed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supported]);

  async function handleEnable() {
    setEnabling(true);
    setMessage(null);
    const result = await subscribeToPush();
    setEnabling(false);
    if (result.ok) {
      setSubscribed(true);
      notify({ title: "Reminders are on" });
    } else {
      setMessage(result.error ?? "Something went wrong. Give it another try in a moment.");
    }
  }

  async function handleDisable() {
    await unsubscribeFromPush();
    setSubscribed(false);
    setMessage(null);
    notify({ title: "Reminders are off" });
  }

  const [state, action, pending] = useActionState(
    async (prev: PrefsState, formData: FormData): Promise<PrefsState> => {
      const result = await updateNotificationPrefsAction(prev, formData);
      if (result.message) notify({ title: "Preferences saved" });
      return {
        ...result,
        savedKey: [
          ...TOGGLES.map((t) => formData.get(t.name) === "on"),
          String(formData.get("quietHoursStart") ?? ""),
          String(formData.get("quietHoursEnd") ?? ""),
        ].join("|"),
      };
    },
    {},
  );
  const currentKey = [...TOGGLES.map((t) => toggles[t.name]), quietStart, quietEnd].join("|");
  const justSaved = Boolean(state.message) && state.savedKey === currentKey;

  function status() {
    if (supported === null || permission === null) return <div className="h-10" aria-hidden />;
    if (!supported) {
      return (
        <p className="text-sm text-foreground/80">
          Reminders aren&apos;t available in this browser. Everything else works fine without them.
        </p>
      );
    }
    if (permission === "denied") {
      return (
        <p className="text-sm text-foreground/80">
          Reminders are blocked in this browser. You can allow them in your browser&apos;s site settings, then come back.
        </p>
      );
    }
    if (subscribed === null) return <div className="h-10" aria-hidden />;
    if (subscribed) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Check className="size-4 text-brand" strokeWidth={3} aria-hidden />
            Reminders are on.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={handleDisable}>
            Turn off
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="brand" onClick={handleEnable} disabled={enabling}>
            {enabling ? "Turning on…" : "Turn on reminders"}
          </Button>
          <p className="text-sm text-foreground/80">Reminders are currently off.</p>
        </div>
        {message && message !== "Reminders are currently off." && (
          <p role="status" className="text-sm text-foreground/80">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4 rounded-3xl bg-tint-sky p-5 sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card/70">
          <Bell className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">Gentle nudges, only when they help</p>
          <p className="text-sm text-foreground/75">
            Reminders for the things you&apos;ve asked to remember. Sent sparingly, never as spam, and you can turn them
            off any time.
          </p>
          <div className="pt-3">{status()}</div>
        </div>
      </div>

      {/* The fields are state-driven; stop React from clearing the form once the action finishes. */}
      <form action={action} onReset={(e) => e.preventDefault()} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium text-foreground/80">What should we remind you about?</legend>
          {TOGGLES.map(({ name, title, hint }) => (
            <label
              key={name}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-foreground/25 has-[[data-checked]]:bg-brand-soft/60"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
              <Checkbox
                name={name}
                checked={toggles[name]}
                onCheckedChange={(checked) => setToggles((t) => ({ ...t, [name]: checked === true }))}
              />
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground/80">Quiet hours</legend>
          <p className="text-xs text-muted-foreground">No reminders between these times. Leave both empty for none.</p>
          <div className="grid max-w-md grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietHoursStart">From</Label>
              <Input
                id="quietHoursStart"
                name="quietHoursStart"
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietHoursEnd">Until</Label>
              <Input
                id="quietHoursEnd"
                name="quietHoursEnd"
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save preferences"}
          </Button>
          {justSaved && (
            <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="size-4 text-brand" strokeWidth={3} aria-hidden />
              Saved
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
