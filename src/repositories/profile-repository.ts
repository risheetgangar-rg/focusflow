import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/user";

interface ProfileRow {
  id: string;
  display_name: string | null;
  timezone: string;
  gamification_mode: string;
  created_at: string;
  updated_at: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    timezone: row.timezone,
    gamificationMode: row.gamification_mode as Profile["gamificationMode"],
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

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: { displayName?: string; timezone?: string },
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(updates.displayName !== undefined && { display_name: updates.displayName }),
      ...(updates.timezone !== undefined && { timezone: updates.timezone }),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return toProfile(data);
}
