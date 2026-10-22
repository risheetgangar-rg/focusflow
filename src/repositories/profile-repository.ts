import type { SupabaseClient } from "@supabase/supabase-js";
import type { GamificationMode, Profile } from "@/types/user";

interface ProfileRow {
  id: string;
  display_name: string | null;
  timezone: string;
  gamification_mode: string;
  theme: string;
  onboarding_completed: boolean;
  focus_areas: string[] | null;
  last_seen_at: string | null;
  away_since: string | null;
  welcome_dismissed_on: string | null;
  created_at: string;
  updated_at: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    timezone: row.timezone,
    gamificationMode: row.gamification_mode as GamificationMode,
    theme: row.theme,
    onboardingCompleted: row.onboarding_completed,
    focusAreas: row.focus_areas ?? [],
    lastSeenAt: row.last_seen_at ?? null,
    awaySince: row.away_since ?? null,
    welcomeDismissedOn: row.welcome_dismissed_on ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? toProfile(data) : null;
}

/** Normally the signup trigger creates the row; this heals accounts that predate it. */
export async function ensureProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const existing = await getProfile(supabase, userId);
  if (existing) return existing;

  const { error } = await supabase.from("profiles").insert({ id: userId });
  if (error && error.code !== "23505") throw error;
  return getProfile(supabase, userId);
}

export interface ProfileUpdates {
  displayName?: string;
  timezone?: string;
  gamificationMode?: GamificationMode;
  theme?: string;
  onboardingCompleted?: boolean;
  focusAreas?: string[];
  lastSeenAt?: string | null;
  awaySince?: string | null;
  welcomeDismissedOn?: string | null;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: ProfileUpdates,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(updates.displayName !== undefined && { display_name: updates.displayName }),
      ...(updates.timezone !== undefined && { timezone: updates.timezone }),
      ...(updates.gamificationMode !== undefined && { gamification_mode: updates.gamificationMode }),
      ...(updates.theme !== undefined && { theme: updates.theme }),
      ...(updates.onboardingCompleted !== undefined && { onboarding_completed: updates.onboardingCompleted }),
      ...(updates.focusAreas !== undefined && { focus_areas: updates.focusAreas }),
      ...(updates.lastSeenAt !== undefined && { last_seen_at: updates.lastSeenAt }),
      ...(updates.awaySince !== undefined && { away_since: updates.awaySince }),
      ...(updates.welcomeDismissedOn !== undefined && { welcome_dismissed_on: updates.welcomeDismissedOn }),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return toProfile(data);
}
