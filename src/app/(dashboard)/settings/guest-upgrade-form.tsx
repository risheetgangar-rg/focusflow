"use client";

import { useActionState, useState } from "react";
import { CircleCheck } from "lucide-react";
import { upgradeGuestAction, type SettingsFormState } from "@/app/(dashboard)/settings/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Plain-language versions of the messages the account service is most likely to send back. */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already") && (m.includes("registered") || m.includes("exists"))) {
    return "That email already has an account. Try a different one.";
  }
  if (m.includes("rate limit") || m.includes("too many")) return "Too many tries. Give it a minute and try again.";
  if (m.includes("password")) return "Pick a password with at least 8 characters.";
  return message;
}

/** Turns a guest into a keepable account without losing anything they've done. */
export function GuestUpgradeForm() {
  const { notify } = useCelebration();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [state, action, pending] = useActionState(
    async (prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> => {
      const result = await upgradeGuestAction(prev, formData);
      if (result.message) notify({ title: "Almost there", detail: "Check your email to confirm it." });
      return result;
    },
    {},
  );

  return (
    // Keep what was typed if something needs fixing (React would otherwise clear the form).
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="upgrade-email">Email</Label>
          <Input
            id="upgrade-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="upgrade-password">Password</Label>
          <Input
            id="upgrade-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
            required
            className="bg-card"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {friendlyError(state.error)}
        </p>
      )}
      {state.message && (
        <p role="status" className="flex items-start gap-2 text-sm text-foreground/80">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          {state.message}
        </p>
      )}

      <Button type="submit" variant="brand" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Keep my data"}
      </Button>
    </form>
  );
}
