import { redirect } from "next/navigation";
import { getProfile } from "@/repositories/profile-repository";
import { createClient } from "@/lib/supabase/server";
import * as reminderRepo from "@/repositories/reminder-repository";
import { ProfileForm } from "./profile-form";
import { NotificationSettings } from "@/components/notifications/notification-settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Connect Supabase to edit your profile here.</p>
      </div>
    );
  }

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

  const prefs = await reminderRepo.getPreferences(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Profile
        </h2>
        <ProfileForm profile={profile} />
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Notifications
        </h2>
        <NotificationSettings prefs={prefs} />
      </section>
    </div>
  );
}
