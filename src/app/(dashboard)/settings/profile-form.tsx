"use client";

import { useActionState, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { updateProfileAction, type SettingsFormState } from "@/app/(dashboard)/settings/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfileState = SettingsFormState & { savedKey?: string };

/**
 * Display name and timezone. The timezone list is worked out on the server
 * (Intl.supportedValuesOf) and handed in, so the browser never has to guess it.
 */
export function ProfileForm({
  displayName,
  timezone,
  timezones,
}: {
  displayName: string;
  timezone: string;
  timezones: string[];
}) {
  const { notify } = useCelebration();
  const [name, setName] = useState(displayName);
  const [zone, setZone] = useState(timezone);

  const items = useMemo(() => timezones.map((value) => ({ value, label: value.replace(/_/g, " ") })), [timezones]);

  const [state, action, pending] = useActionState(
    async (prev: ProfileState, formData: FormData): Promise<ProfileState> => {
      const result = await updateProfileAction(prev, formData);
      if (result.message) notify({ title: "Profile saved" });
      return {
        ...result,
        savedKey: `${String(formData.get("displayName") ?? "").trim()}|${String(formData.get("timezone") ?? "")}`,
      };
    },
    {},
  );

  const justSaved = Boolean(state.message) && state.savedKey === `${name.trim()}|${zone}`;

  return (
    // The fields are state-driven; stop React from clearing the form once the action finishes.
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">What should we call you?</Label>
          <Input
            id="displayName"
            name="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
            maxLength={80}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            name="timezone"
            value={zone}
            onValueChange={(next) => {
              if (next) setZone(next);
            }}
            items={items}
          >
            <SelectTrigger id="timezone" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="max-h-72">
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Decides when your day starts and when reminders arrive.</p>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {justSaved && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="size-4 text-brand" strokeWidth={3} aria-hidden />
            Saved
          </p>
        )}
      </div>
    </form>
  );
}
