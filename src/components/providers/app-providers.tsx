import { CelebrationProvider } from "@/components/gamification/celebration-provider";
import { AppContextProvider } from "@/components/providers/app-context";
import { ThemeSync } from "@/components/layout/theme-sync";
import { TimezoneSync } from "@/components/providers/timezone-sync";
import { getSession } from "@/lib/auth/session";

/**
 * Wraps the whole app. When someone is signed in, every client component
 * (including the chromeless Focus Mode) can reach their timezone, game mode,
 * and the celebration system. Signed out, children render untouched.
 */
export async function AppProviders({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <>{children}</>;

  const { profile, timezone } = session;
  return (
    <AppContextProvider value={{ timezone, mode: profile.gamificationMode, displayName: profile.displayName }}>
      <CelebrationProvider mode={profile.gamificationMode}>{children}</CelebrationProvider>
      <ThemeSync theme={profile.theme} />
      <TimezoneSync profileTimezone={profile.timezone} />
    </AppContextProvider>
  );
}
