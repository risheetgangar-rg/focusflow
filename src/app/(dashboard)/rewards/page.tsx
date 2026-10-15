import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/primitives";
import { AchievementsGallery } from "@/components/rewards/achievements-gallery";
import { QuestsPanel } from "@/components/rewards/quests-panel";
import { RewardsHero } from "@/components/rewards/rewards-hero";
import { RewardsOff } from "@/components/rewards/rewards-off";
import { UnlockRoadmap } from "@/components/rewards/unlock-roadmap";
import { XpLedger } from "@/components/rewards/xp-ledger";
import { requireSession } from "@/lib/auth/session";
import { companionStage, levelProgress, nextMomentum } from "@/lib/gamification/rules";
import {
  getState,
  listAchievementStatuses,
  listQuestsForDate,
  listRecentXpEvents,
} from "@/repositories/gamification-repository";
import { todayDateString } from "@/services/habit-service";
import type { Quest } from "@/types/gamification";

export const metadata: Metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const { supabase, userId, profile, timezone } = await requireSession();
  if (profile.gamificationMode === "off") return <RewardsOff />;

  const full = profile.gamificationMode === "full";
  const now = new Date();
  const today = todayDateString(now, timezone);

  const [state, ledger, quests, achievements] = await Promise.all([
    getState(supabase, userId),
    listRecentXpEvents(supabase, userId, 8),
    full ? listQuestsForDate(supabase, userId, today) : Promise.resolve<Quest[]>([]),
    full ? listAchievementStatuses(supabase, userId) : Promise.resolve([]),
  ]);

  const progress = levelProgress(state.xp);
  // Momentum is a "stretch" that ends after a few quiet hours. Show it as over once it has.
  const stretchIsLive =
    state.currentMomentum > 0 && nextMomentum(state.currentMomentum, state.lastActivityAt, now) > state.currentMomentum;
  const momentum = stretchIsLive ? state.currentMomentum : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <Reveal>
        <header className="max-w-2xl space-y-3">
          <p className="text-eyebrow">Rewards</p>
          <h1 className="font-display text-4xl sm:text-5xl">
            Your <span className="italic">progress</span>
          </h1>
          <p className="text-muted-foreground">Every small step adds up. Here&apos;s what yours have built.</p>
        </header>
      </Reveal>

      <Reveal delay={0.08}>
        <RewardsHero
          level={progress.level}
          title={progress.title}
          stage={companionStage(progress.level)}
          mood={momentum >= 3 ? "cheer" : "happy"}
          xpIntoLevel={progress.xpIntoLevel}
          xpForNextLevel={progress.xpForNextLevel}
          fraction={progress.fraction}
          totalXp={state.xp}
          momentum={momentum}
          bestMomentum={Math.max(state.longestMomentum, momentum)}
        />
      </Reveal>

      {full ? (
        <>
          <div className="grid items-start gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Reveal inView>
                <AchievementsGallery achievements={achievements} timezone={timezone} />
              </Reveal>
            </div>
            <div className="space-y-6 lg:col-span-2 lg:space-y-8">
              <Reveal inView>
                <QuestsPanel quests={quests} />
              </Reveal>
              <Reveal inView>
                <XpLedger entries={ledger} today={today} timezone={timezone} />
              </Reveal>
            </div>
          </div>

          <Reveal inView>
            <UnlockRoadmap level={progress.level} />
          </Reveal>
        </>
      ) : (
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Reveal inView>
            <XpLedger entries={ledger} today={today} timezone={timezone} />
          </Reveal>
          <p className="text-center text-sm text-muted-foreground">
            Want daily quests, achievements and a companion that grows?{" "}
            <Link
              href="/settings#game-layer"
              className="font-medium text-foreground underline underline-offset-4 hover:text-brand"
            >
              Try the Full game layer
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
