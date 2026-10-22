"use client";

import Link from "next/link";
import { CalmScreen } from "@/components/marketing/calm-screen";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * The friendly fallback for anything that breaks while rendering. It deliberately shows
 * nothing about what went wrong (no message, no stack): just a calm way to try again.
 */
export default function ErrorPage({ retry, reset }: { retry?: () => void; reset: () => void }) {
  // `retry` re-fetches and re-renders the failed segment; `reset` only clears the error state.
  const tryAgain = retry ?? reset;

  return (
    <>
      <title>Something went sideways · Unstuck</title>
      <CalmScreen
        mood="sleepy"
        tint="peach"
        eyebrow="Hiccup"
        title={
          <>
            Something went <em>sideways.</em>
          </>
        }
        actions={
          <>
            <Button size="lg" onClick={() => tryAgain()}>
              Try again
            </Button>
            <Link href="/" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Go home
            </Link>
          </>
        }
      >
        <p>That one&apos;s on us, not you. Your tasks are safe. Give it another go.</p>
      </CalmScreen>
    </>
  );
}
