import type { Metadata } from "next";
import { CalmScreen } from "@/components/marketing/calm-screen";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "You're offline", robots: { index: false } };

/**
 * Served by the service worker when a page can't be reached. Kept as a plain, script-free page:
 * "Try again" is an ordinary link, so it works even when nothing else has loaded.
 */
export default function OfflinePage() {
  return (
    <CalmScreen
      mood="sleepy"
      tint="sky"
      eyebrow="Offline"
      title={
        <>
          You&apos;re <em>offline.</em>
        </>
      }
      actions={
        // A normal link on purpose: it asks the browser for a fresh page rather than using the app's router.
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a href="/" className={buttonVariants({ size: "lg" })}>
          Try again
        </a>
      }
    >
      <p>
        No problem. FocusFlow needs a connection for this page, and your tasks are safe. Pick up as soon as you&apos;re
        back online.
      </p>
    </CalmScreen>
  );
}
