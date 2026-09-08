"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signInWithMagicLink, type AuthFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

export default function LoginPage() {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signIn,
    initialState,
  );
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(
    signInWithMagicLink,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={passwordAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-muted-foreground text-sm">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {passwordState.error && (
            <p className="text-destructive text-sm">{passwordState.error}</p>
          )}
          <Button type="submit" disabled={passwordPending} className="w-full">
            Sign in
          </Button>
        </form>

        <div className="text-muted-foreground text-center text-sm">or</div>

        <form action={magicLinkAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email for a magic link</Label>
            <Input id="magic-email" name="email" type="email" autoComplete="email" required />
          </div>
          {magicLinkState.error && (
            <p className="text-destructive text-sm">{magicLinkState.error}</p>
          )}
          {magicLinkState.message && (
            <p className="text-sm text-green-700 dark:text-green-500">
              {magicLinkState.message}
            </p>
          )}
          <Button type="submit" variant="outline" disabled={magicLinkPending} className="w-full">
            Send magic link
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          No account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
