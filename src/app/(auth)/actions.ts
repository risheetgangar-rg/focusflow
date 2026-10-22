"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/dates/tz";
import { updateProfile } from "@/repositories/profile-repository";
import { seedGuestDemo } from "@/services/demo-service";
import {
  forgotPasswordSchema,
  magicLinkSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

export interface AuthFormState {
  error?: string;
  message?: string;
}

const NOT_CONFIGURED = "This copy of Unstuck isn't connected to a backend yet.";

/** Where auth emails should link back to: the configured site URL, else whatever host served this request. */
async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Only ever redirect to a path on this site. */
function safeNext(value: FormDataEntryValue | null, fallback = "/today"): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Try again?";
  if (m.includes("email not confirmed")) return "Confirm your email first. We sent you a link.";
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "That email already has an account. Try signing in instead.";
  }
  if (m.includes("rate limit") || m.includes("too many")) return "Too many tries. Give it a minute and try again.";
  if (m.includes("anonymous sign-ins are disabled")) {
    return "Guest mode isn't switched on for this project yet.";
  }
  return message;
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendly(error.message) };

  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const timezone = String(formData.get("timezone") || "");
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/today`,
      data: timezone ? { timezone } : {},
    },
  });
  if (error) return { error: friendly(error.message) };

  // With email confirmation off, Supabase signs the person in straight away.
  if (data.session) redirect("/today");

  return { message: "Check your email for a link to confirm your account." };
}

export async function signInWithMagicLink(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/today` },
  });
  if (error) return { error: friendly(error.message) };

  return { message: "Check your email for a sign-in link." };
}

/** Guest mode: a real (anonymous) account so data is private and saved, with no email or password. */
export async function signInAsGuest(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return { error: friendly(error.message) };

  // Guests start with a small sample list, so they can see how everything works right away.
  if (data.user) {
    const timezone = String(formData.get("timezone") || "");
    try {
      if (isValidTimezone(timezone)) await updateProfile(supabase, data.user.id, { timezone });
      await seedGuestDemo(supabase, data.user.id, isValidTimezone(timezone) ? timezone : "UTC");
    } catch (err) {
      console.warn("guest demo data not created", err);
    }
  }

  redirect("/today");
}

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/confirm?next=/reset-password`,
  });
  if (error) return { error: friendly(error.message) };

  return { message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Use at least 8 characters." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendly(error.message) };

  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
