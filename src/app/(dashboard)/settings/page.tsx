import type { Metadata } from "next";
import { Bell, Gamepad2, Palette, ShieldCheck, User } from "lucide-react";
import { NotificationSettings } from "@/components/notifications/notification-settings";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import { requireSession } from "@/lib/auth/session";
import { levelProgress } from "@/lib/gamification/rules";
import { getState } from "@/repositories/gamification-repository";
import { getPreferences } from "@/repositories/reminder-repository";
import { AccountSection } from "./account-section";
import { GameLayerPicker } from "./game-layer-picker";
import { ProfileForm } from "./profile-form";
import { SettingsSection } from "./settings-section";
import { ThemePicker } from "./theme-picker";

export const metadata: Metadata = { title: "Settings" };

/** Every timezone this runtime knows, UTC first. Worked out here so the browser never has to guess. */
function timezoneOptions(current: string): string[] {
  const known = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  const rest = [...new Set([...known, current])].filter((zone) => zone !== "UTC").sort();
  return ["UTC", ...rest];
}

export default async function SettingsPage() {
  const { supabase, userId, email, isGuest, profile, timezone } = await requireSession();

  const [prefs, game] = await Promise.all([getPreferences(supabase, userId), getState(supabase, userId)]);
  const level = levelProgress(game.xp).level;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <Reveal>
        <header className="space-y-3">
          <p className="text-eyebrow">Settings</p>
          <h1 className="font-display text-4xl sm:text-5xl">
            Make it <span className="italic">yours</span>.
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Your name, your look, and how much game you want. All of it changes any time.
          </p>
        </header>
      </Reveal>

      <Stagger className="space-y-6" delay={0.1}>
        <StaggerItem>
          <SettingsSection
            id="profile"
            icon={User}
            tint="bg-tint-lavender"
            title="Profile"
            description="How we greet you, and when your day starts."
          >
            <ProfileForm
              displayName={profile.displayName ?? ""}
              timezone={timezone}
              timezones={timezoneOptions(timezone)}
            />
          </SettingsSection>
        </StaggerItem>

        <StaggerItem>
          <SettingsSection
            id="appearance"
            icon={Palette}
            tint="bg-tint-peach"
            title="Appearance"
            description={
              profile.gamificationMode === "full"
                ? "Pick a look that's easy on your eyes. Some themes unlock as you level up."
                : "Pick a look that's easy on your eyes."
            }
          >
            <ThemePicker currentTheme={profile.theme} level={level} mode={profile.gamificationMode} />
          </SettingsSection>
        </StaggerItem>

        <StaggerItem>
          <SettingsSection
            id="game-layer"
            icon={Gamepad2}
            tint="bg-tint-butter"
            title="Game layer"
            description="How much game do you want? Switch any time. Nothing you've done is ever lost."
          >
            <GameLayerPicker current={profile.gamificationMode} />
          </SettingsSection>
        </StaggerItem>

        <StaggerItem>
          <SettingsSection
            id="reminders"
            icon={Bell}
            tint="bg-tint-sky"
            title="Reminders"
            description="Optional nudges, on your terms."
          >
            <NotificationSettings prefs={prefs} />
          </SettingsSection>
        </StaggerItem>

        <StaggerItem>
          <SettingsSection
            id="account"
            icon={ShieldCheck}
            tint="bg-tint-rose"
            title="Account"
            description={isGuest ? "You haven't added an email yet." : "The details you sign in with."}
          >
            <AccountSection email={email} isGuest={isGuest} />
          </SettingsSection>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
