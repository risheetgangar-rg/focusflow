"use client";

import { useActionState, useState } from "react";
import { updatePassword, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { AuthHeading, FormMessage } from "./form-bits";
import { PasswordField } from "./password-field";

const initialState: AuthFormState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-8">
      <AuthHeading
        title="Choose a new password"
        subtitle="Pick something you'll remember, or let your password manager choose one."
      />

      <form action={formAction} className="space-y-5">
        <PasswordField
          label="New password"
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters."
          value={password}
          onValueChange={setPassword}
        />

        <FormMessage>{state.error}</FormMessage>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
