"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/validation/auth";
import { updateProfile } from "@/repositories/profile-repository";

export interface OnboardingInput {
  displayName?: string;
  focusAreas: string[];
  gamificationMode: "off" | "light" | "full";
  timezone?: string;
}

/** Saves what the person told us and marks onboarding done. Quick enough that skipping any step is fine. */
export async function completeOnboardingAction(input: OnboardingInput): Promise<{ ok: boolean; error?: string }> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Something looks off. Try that again?" };

  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  const { displayName, focusAreas, gamificationMode, timezone } = parsed.data;
  await updateProfile(session.supabase, session.userId, {
    ...(displayName ? { displayName } : {}),
    ...(timezone && session.profile.timezone === "UTC" ? { timezone } : {}),
    focusAreas,
    gamificationMode,
    onboardingCompleted: true,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
