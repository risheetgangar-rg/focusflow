"use client";

import { useActionState, useState } from "react";
import { Check, MapPin } from "lucide-react";
import { updateProfileAction, type SettingsFormState } from "@/app/(dashboard)/settings/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileState = SettingsFormState & { savedName?: string };

/** "India Standard Time" rather than "Asia/Kolkata". */
function zoneName(timezone: string): string {
  try {
    const part = new Intl.DateTimeFormat("en", { timeZone: timezone, timeZoneName: "long" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? timezone;
  } catch {
    return timezone.replace(/_/g, " ");
  }
}

/**
 * Just the name. The timezone is never asked for: it follows the phone
 * (see TimezoneSync), and is only shown here so it's clear where it came from.
 */
export function ProfileForm({ displayName, timezone }: { displayName: string; timezone: string }) {
  const { notify } = useCelebration();
  const [name, setName] = useState(displayName);

  const [state, action, pending] = useActionState(
    async (prev: ProfileState, formData: FormData): Promise<ProfileState> => {
      const result = await updateProfileAction(prev, formData);
      if (result.message) notify({ title: "Profile saved" });
      return { ...result, savedName: String(formData.get("displayName") ?? "").trim() };
    },
    {},
  );

  const justSaved = Boolean(state.message) && state.savedName === name.trim();

  return (
    // The field is state-driven; stop React from clearing the form once the action finishes.
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-5">
      <div className="max-w-sm space-y-2">
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

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5" aria-hidden />
        Times follow your phone: {zoneName(timezone)}
      </p>

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
