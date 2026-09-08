import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { QuickAdd } from "@/components/layout/quick-add";
import { LevelBadge } from "@/components/gamification/level-badge";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getProfile } from "@/repositories/profile-repository";
import * as gamificationRepo from "@/repositories/gamification-repository";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  let showGamification = false;
  let gamificationState: { xp: number; currentMomentum: number } | null = null;
  if (supabase && user) {
    const profile = await getProfile(supabase, user.id);
    showGamification = profile?.gamificationMode !== "off";
    if (showGamification) {
      const state = await gamificationRepo.getState(supabase, user.id);
      gamificationState = { xp: state.xp, currentMomentum: state.currentMomentum };
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!isSupabaseConfigured && (
        <div className="bg-amber-100 px-6 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Local demo — Supabase isn&apos;t connected yet, so accounts and data aren&apos;t real.
        </div>
      )}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <nav className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/today">Today</Link>
          <Link href="/tasks">Tasks</Link>
          <Link href="/habits">Habits</Link>
          <Link href="/brain-dump">Brain dump</Link>
          <Link href="/rescue">Rescue</Link>
          <Link href="/review">Review</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        <div className="flex items-center gap-3">
          {gamificationState && (
            <LevelBadge xp={gamificationState.xp} momentum={gamificationState.currentMomentum} />
          )}
          <QuickAdd />
          {isSupabaseConfigured && (
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          )}
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
