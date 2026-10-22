import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { GuestSignOut } from "./guest-sign-out";
import { GuestUpgradeForm } from "./guest-upgrade-form";

/** Guests get a friendly way to keep their data; everyone else sees who they're signed in as. */
export function AccountSection({ email, isGuest }: { email: string | null; isGuest: boolean }) {
  if (isGuest) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-tint-butter p-5 sm:p-6">
          <h3 className="font-display text-2xl">You&apos;re using Unstuck as a guest</h3>
          <p className="mt-2 max-w-xl text-sm text-foreground/80">
            Everything you add is saved to this device&apos;s account only. Add an email and a password to keep it, and
            to pick up where you left off on any device.
          </p>
          <div className="mt-5">
            <GuestUpgradeForm />
          </div>
        </div>

        <GuestSignOut />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="truncate text-base font-medium">{email ?? "your account"}</p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}
