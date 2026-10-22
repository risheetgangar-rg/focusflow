import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { resolveTimezone } from "@/lib/dates/tz";
import { ensureProfile } from "@/repositories/profile-repository";
import type { Profile } from "@/types/user";

export interface Session {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  isGuest: boolean;
  profile: Profile;
  timezone: string;
}

/**
 * The signed-in user for this request, resolved once and shared by the layout,
 * page, and any server action in the same request (React `cache`). Uses the
 * locally-verified JWT claims, so it doesn't add a network round trip on top
 * of the session refresh the proxy already did.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const profile = await ensureProfile(supabase, claims.sub);
  if (!profile) return null;

  return {
    supabase,
    userId: claims.sub,
    email: typeof claims.email === "string" && claims.email ? claims.email : null,
    isGuest: claims.is_anonymous === true,
    // Build plan step 4: no XP, levels, streaks or badges. Switched off for everyone here
    // (the code stays, so it can come back later as an opt-in experiment).
    profile: { ...profile, gamificationMode: "off" },
    timezone: resolveTimezone(profile.timezone),
  };
});

/** For pages: send people somewhere sensible instead of rendering without a user. */
export async function requireSession(): Promise<Session> {
  if (!isSupabaseConfigured) redirect("/setup");
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
