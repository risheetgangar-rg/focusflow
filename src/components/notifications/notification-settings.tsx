"use client";

import { useActionState, useState } from "react";
import {
  updateNotificationPrefsAction,
  type NotificationPrefsState,
} from "@/app/(dashboard)/settings/notification-actions";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/notifications/subscribe";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NotificationPreferences } from "@/types/reminder";

const initialState: NotificationPrefsState = {};

export function NotificationSettings({ prefs }: { prefs: NotificationPreferences }) {
  const [state, action, pending] = useActionState(updateNotificationPrefsAction, initialState);
  const [enabling, setEnabling] = useState(false);
  const [enableError, setEnableError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  async function handleEnable() {
    setEnabling(true);
    setEnableError(null);
    const result = await subscribeToPush();
    setEnabling(false);
    if (result.ok) {
      setEnabled(true);
    } else {
      setEnableError(result.error ?? "Something went wrong.");
    }
  }

  async function handleDisable() {
    await unsubscribeFromPush();
    setEnabled(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-lg border p-4">
        <p className="font-medium">Reminders</p>
        <p className="text-muted-foreground text-sm">
          Get a gentle nudge for upcoming tasks, habits, and deadlines — sent sparingly, never as
          spam. You can turn this off anytime.
        </p>
        {!isPushSupported() ? (
          <p className="text-muted-foreground text-sm">
            Push notifications aren&apos;t supported in this browser.
          </p>
        ) : enabled === false ? (
          <p className="text-muted-foreground text-sm">Reminders are currently off.</p>
        ) : enabled === true ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-green-700 dark:text-green-500">Reminders are on.</p>
            <Button type="button" variant="ghost" size="sm" onClick={handleDisable}>
              Turn off
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={handleEnable} disabled={enabling} size="sm">
            {enabling ? "Enabling…" : "Enable reminders"}
          </Button>
        )}
        {enableError && <p className="text-destructive text-sm">{enableError}</p>}
      </div>

      <form action={action} className="max-w-sm space-y-4">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="notifyTaskReminders" defaultChecked={prefs.notifyTaskReminders} />
            Task reminders
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="notifyHabitReminders" defaultChecked={prefs.notifyHabitReminders} />
            Habit reminders
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="notifyDeadlineReminders" defaultChecked={prefs.notifyDeadlineReminders} />
            Deadline reminders
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="notifyRescueReminders" defaultChecked={prefs.notifyRescueReminders} />
            Rescue reminders
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quietHoursStart">Quiet hours start</Label>
            <Input
              id="quietHoursStart"
              name="quietHoursStart"
              type="time"
              defaultValue={prefs.quietHoursStart ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quietHoursEnd">Quiet hours end</Label>
            <Input
              id="quietHoursEnd"
              name="quietHoursEnd"
              type="time"
              defaultValue={prefs.quietHoursEnd ?? ""}
            />
          </div>
        </div>

        {state.message && (
          <p className="text-sm text-green-700 dark:text-green-500">{state.message}</p>
        )}
        {state.error && <p className="text-destructive text-sm">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          Save preferences
        </Button>
      </form>
    </div>
  );
}
