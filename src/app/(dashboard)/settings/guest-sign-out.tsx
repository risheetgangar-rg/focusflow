"use client";

import { useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

/** Signing out of a guest account is permanent, so ask once before doing it. */
export function GuestSignOut() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Sign out
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-muted/70 p-4">
      <p className="text-sm text-foreground/85">
        A guest account can&apos;t be reopened once you sign out, so everything saved here would be gone. Sign out anyway?
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Keep it
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="destructive" size="sm">
            Sign out anyway
          </Button>
        </form>
      </div>
    </div>
  );
}
