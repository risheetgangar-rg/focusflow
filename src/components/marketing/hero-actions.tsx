"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { signInAsGuest, type AuthFormState } from "@/app/(auth)/actions";
import { Button, buttonVariants } from "@/components/ui/button";

const initialState: AuthFormState = {};

/** The two hero calls to action. "Try it as a guest" signs in anonymously, so there's nothing to fill in. */
export function HeroActions() {
  const [state, guestAction, pending] = useActionState(signInAsGuest, initialState);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        <Link href="/signup" className={buttonVariants({ size: "xl" })}>
          Start free
          <ArrowRight aria-hidden />
        </Link>
        <form
          action={(formData: FormData) => {
        // The browser's timezone, read on submit, so the sample tasks land on the right days.
        formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
        return guestAction(formData);
      }}
          className="flex"
        >
          <Button type="submit" variant="outline" size="xl" disabled={pending} className="w-full flex-1">
            {pending ? "Setting things up…" : "Try it as a guest"}
          </Button>
        </form>
      </div>

      {state.error ? (
        <p role="alert" className="max-w-sm text-center text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Guest mode opens a sample list to play with. No email or password.{" "}
        <span className="whitespace-nowrap">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-brand"
          >
            Log in
          </Link>
        </span>
      </p>
    </div>
  );
}
