"use client";

import { useActionState } from "react";
import { signInAsGuest, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "./form-bits";

const initialState: AuthFormState = {};

/** "Continue as guest": a private account with no email or password, so there's nothing to fill in. */
export function GuestForm({ label = "Continue as guest" }: { label?: string }) {
  const [state, formAction, pending] = useActionState(signInAsGuest, initialState);

  return (
    <form
      action={(formData: FormData) => {
        // The browser's timezone, read on submit, so the sample tasks land on the right days.
        formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
        return formAction(formData);
      }}
      className="space-y-2.5"
    >
      <Button type="submit" variant="outline" size="lg" disabled={pending} className="w-full">
        {pending ? "Setting things up…" : label}
      </Button>
      {state.error ? (
        <FormMessage>{state.error}</FormMessage>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          No email or password needed. You can add an email later in Settings.
        </p>
      )}
    </form>
  );
}
