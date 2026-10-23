"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { THEMES, isThemeUnlocked, levelForXp } from "@/lib/gamification/rules";
import {
  gamificationModeSchema,
  themeSchema,
  updateProfileSchema,
} from "@/lib/validation/auth";
import { getState } from "@/repositories/gamification-repository";
import { updateProfile } from "@/repositories/profile-repository";
import { isValidTimezone } from "@/lib/dates/tz";

export interface SettingsFormState {
  error?: string;
  message?: string;
}

export async function updateProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  await updateProfile(session.supabase, session.userId, parsed.data);
  revalidatePath("/", "layout");
  return { message: "Saved." };
}

export async function setThemeAction(theme: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return { ok: false, error: "Unknown theme." };

  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  const definition = THEMES.find((t) => t.id === parsed.data);
  if (!definition) return { ok: false, error: "Unknown theme." };

  const { xp } = await getState(session.supabase, session.userId);
  if (!isThemeUnlocked(definition, levelForXp(xp), session.profile.gamificationMode)) {
    return { ok: false, error: `Unlocks at level ${definition.unlockLevel}.` };
  }

  await updateProfile(session.supabase, session.userId, { theme: parsed.data });
  return { ok: true };
}

export async function setGamificationModeAction(mode: string): Promise<{ ok: boolean }> {
  const parsed = gamificationModeSchema.safeParse(mode);
  if (!parsed.success) return { ok: false };

  const session = await getSession();
  if (!session) return { ok: false };

  await updateProfile(session.supabase, session.userId, { gamificationMode: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** The timezone always follows the phone: when it changes (travel, a new phone), the profile follows quietly. */
export async function syncTimezoneAction(timezone: string): Promise<void> {
  if (!isValidTimezone(timezone)) return;
  const session = await getSession();
  if (!session || session.profile.timezone === timezone) return;
  await updateProfile(session.supabase, session.userId, { timezone });
  revalidatePath("/", "layout");
}

/** Turns a guest into a keepable account without losing anything they've done. */
export async function upgradeGuestAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Use at least 8 characters." };

  const { error } = await session.supabase.auth.updateUser({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { message: "Done. Check your email to confirm it, and your data stays right here." };
}
