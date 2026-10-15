"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckEmail } from "./check-email";
import { AuthHeading, FormMessage, OrDivider, textLinkClass } from "./form-bits";
import { GuestForm } from "./guest-form";
import { PasswordField } from "./password-field";

const initialState: AuthFormState = {};

function SignupFormInner({ onStartOver }: { onStartOver: () => void }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sentTo, setSentTo] = useState("");

  if (state.message) {
    return (
      <CheckEmail
        footer={
          <p className="text-sm text-muted-foreground">
            Wrong address?{" "}
            <button type="button" onClick={onStartOver} className={textLinkClass}>
              Start over
            </button>
          </p>
        }
      >
        <p>
          We sent a link to <span className="font-medium text-foreground">{sentTo || "your inbox"}</span>. Open it to
          finish creating your account.
        </p>
        <p className="text-sm">Nothing there yet? Give it a minute, then check your spam folder.</p>
      </CheckEmail>
    );
  }

  return (
    <div className="space-y-8">
      <AuthHeading
        title="Let's get you started."
        subtitle="Create an account to keep your tasks safe and in sync. It takes about a minute."
      />

      <form
        // The browser's timezone is read when the form is submitted, never during render.
        action={(formData) => {
          formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
          setSentTo(String(formData.get("email") ?? ""));
          formAction(formData);
        }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <PasswordField
          label="Password"
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters."
          value={password}
          onValueChange={setPassword}
        />

        <FormMessage>{state.error}</FormMessage>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating your account…" : "Create account"}
        </Button>
      </form>

      <OrDivider />

      <GuestForm label="Just looking around? Continue as guest" />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className={textLinkClass}>
          Log in
        </Link>
      </p>
    </div>
  );
}

export function SignupForm() {
  // Bumping the key gives "Start over" a brand new form (and a fresh action state).
  const [attempt, setAttempt] = useState(0);
  return <SignupFormInner key={attempt} onStartOver={() => setAttempt((current) => current + 1)} />;
}
