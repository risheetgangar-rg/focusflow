"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signInWithMagicLink, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthHeading, FormMessage, OrDivider, SoftNotice, textLinkClass } from "./form-bits";
import { GuestForm } from "./guest-form";
import { PasswordField } from "./password-field";

const initialState: AuthFormState = {};

/** A compact "email me a link instead" form. Until you type here, it borrows the email from the main form. */
function MagicLinkForm({ borrowedEmail }: { borrowedEmail: string }) {
  const [state, formAction, pending] = useActionState(signInWithMagicLink, initialState);
  const [typed, setTyped] = useState<string | null>(null);
  const email = typed ?? borrowedEmail;

  return (
    <form action={formAction} className="space-y-2.5">
      <Label htmlFor="magic-email">Or email me a sign-in link</Label>
      <div className="flex gap-2">
        <Input
          id="magic-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setTyped(event.target.value)}
        />
        <Button type="submit" variant="outline" disabled={pending} className="h-11 shrink-0 px-5">
          {pending ? "Sending…" : "Send link"}
        </Button>
      </div>
      <FormMessage>{state.error}</FormMessage>
      <FormMessage tone="success">{state.message}</FormMessage>
    </form>
  );
}

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-8">
      <AuthHeading title="Welcome back." subtitle="Pick up right where you left off." />

      {notice && !state.error ? <SoftNotice>{notice}</SoftNotice> : null}

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
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
          autoComplete="current-password"
          value={password}
          onValueChange={setPassword}
          labelAside={
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        <FormMessage>{state.error}</FormMessage>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <OrDivider />

      <div className="space-y-6">
        <MagicLinkForm borrowedEmail={email} />
        <GuestForm />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className={textLinkClass}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
