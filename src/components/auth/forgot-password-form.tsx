"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState, useState } from "react";
import { requestPasswordReset, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckEmail } from "./check-email";
import { AuthHeading, FormMessage, textLinkClass } from "./form-bits";

const initialState: AuthFormState = {};

function BackToLogin() {
  return (
    <Link href="/login" className={`${textLinkClass} inline-flex items-center gap-1.5 text-sm`}>
      <ArrowLeft aria-hidden className="size-3.5" />
      Back to log in
    </Link>
  );
}

function ForgotPasswordFormInner({ onStartOver }: { onStartOver: () => void }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);
  const [email, setEmail] = useState("");

  if (state.message) {
    return (
      <CheckEmail
        footer={
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Used the wrong address?{" "}
              <button type="button" onClick={onStartOver} className={textLinkClass}>
                Try again
              </button>
            </p>
            <BackToLogin />
          </div>
        }
      >
        <p>{state.message}</p>
        <p className="text-sm">Nothing yet? Give it a minute, then check your spam folder.</p>
      </CheckEmail>
    );
  }

  return (
    <div className="space-y-8">
      <AuthHeading
        title="Reset your password"
        subtitle="Forgetting one is completely normal. Enter your email and we'll send a link to choose a new one."
      />

      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
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

        <FormMessage>{state.error}</FormMessage>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center">
        <BackToLogin />
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [attempt, setAttempt] = useState(0);
  return <ForgotPasswordFormInner key={attempt} onStartOver={() => setAttempt((current) => current + 1)} />;
}
