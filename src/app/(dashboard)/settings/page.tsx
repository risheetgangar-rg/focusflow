import { redirect } from "next/navigation";
import { getProfile } from "@/repositories/profile-repository";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    return <p className="text-muted-foreground">Couldn&apos;t load your profile.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
