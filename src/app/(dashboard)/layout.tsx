import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { GuestBanner } from "@/components/layout/guest-banner";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { QuickAddProvider } from "@/components/layout/quick-add-provider";
import { AppProviders } from "@/components/providers/app-providers";
import { WinLayer } from "@/components/rewards/win-layer";
import { NextUpNotifier } from "@/components/notifications/next-up-notifier";
import { requireSession } from "@/lib/auth/session";
import { getState } from "@/repositories/gamification-repository";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!session.profile.onboardingCompleted) redirect("/onboarding");

  const { profile, supabase, userId, email, isGuest } = session;
  const game =
    profile.gamificationMode === "off"
      ? { xp: 0, currentMomentum: 0 }
      : await getState(supabase, userId);

  const identity = {
    displayName: profile.displayName,
    email,
    isGuest,
    mode: profile.gamificationMode,
    xp: game.xp,
    momentum: game.currentMomentum,
  };

  return (
    <AppProviders>
      <QuickAddProvider>
        <AppSidebar {...identity} />
        <div className="flex min-h-dvh flex-col lg:pl-[17rem]">
          <MobileTopBar {...identity} />
          <main id="main" className="w-full flex-1 px-5 pt-8 pb-32 sm:px-8 lg:px-12 lg:pt-12 lg:pb-16">
            {isGuest && <GuestBanner />}
            {children}
          </main>
        </div>
        <MobileNav />
        <WinLayer />
        <NextUpNotifier isGuest={isGuest} />
      </QuickAddProvider>
    </AppProviders>
  );
}
