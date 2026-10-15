import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ExpiredLink } from "@/components/auth/expired-link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

/** The emailed link signs you in, so with no session here the link was already used or has timed out. */
async function hasRecoverySession(): Promise<boolean> {
  const supabase = await createClient();
  // Not connected to a backend (local demo): show the form so the screen can still be seen.
  if (!supabase) return true;

  try {
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims?.sub);
  } catch {
    // If we can't tell, let them try: the form reports a real problem if there is one.
    return true;
  }
}

export default async function ResetPasswordPage() {
  const canReset = await hasRecoverySession();

  return <AuthShell panel="reset">{canReset ? <ResetPasswordForm /> : <ExpiredLink />}</AuthShell>;
}
