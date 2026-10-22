import type { Metadata } from "next";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight, LifeBuoy, Plus } from "lucide-react";
import { QuestCard } from "@/components/gamification/quest-card";
import { TaskList } from "@/components/tasks/task-list";
import { BossCard } from "@/components/today/boss-card";
import { SessionPing } from "@/components/today/session-ping";
import { TodayHabits, type HabitToday } from "@/components/today/today-habits";
import { WelcomeBack } from "@/components/today/welcome-back";
import { PretendAwayButton } from "@/components/today/pretend-away-button";
import { TodayProgress } from "@/components/today/today-progress";
import { UndoMoveBar, WelcomeBackMode } from "@/components/today/welcome-back-mode";
import {
  UNDO_HOURS,
  calendarDaysBetween,
  pickOneWin,
  timeLabel,
  waitingTasks,
  welcomeBackStart,
} from "@/lib/welcome-back/rules";
import { updateProfile } from "@/repositories/profile-repository";
import { latestUndoableShift } from "@/repositories/welcome-repository";
import { WhatsNextHero } from "@/components/today/whats-next-hero";
import { buttonVariants } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { zonedDateString, zonedHour } from "@/lib/dates/tz";
import { isComeback, levelProgress } from "@/lib/gamification/rules";
import { groupSubtasks, groupTasks } from "@/lib/tasks/group";
import * as gamificationRepo from "@/repositories/gamification-repository";
import * as habitRepo from "@/repositories/habit-repository";
import * as taskRepo from "@/repositories/task-repository";
import { getWeekDates, weeklyProgress } from "@/services/habit-service";
import { ensureDailyQuest, ensureSideQuest } from "@/services/quest-service";
import { recommendNext, recommendTop } from "@/services/recommendation-service";
import { needsRescue } from "@/services/rescue-service";
import type { Quest } from "@/types/gamification";

export const metadata: Metadata = { title: "Today" };

const DAY_MS = 86_400_000;

function greeting(hour: number) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  const { supabase, userId, profile, timezone } = await requireSession();
  const mode = profile.gamificationMode;
  const now = new Date();
  const today = zonedDateString(now, timezone);
  const weekDates = getWeekDates(now, timezone);

  const [tasks, habits, game] = await Promise.all([
    taskRepo.listVisibleTasks(supabase, userId, new Date(now.getTime() - 2 * DAY_MS)),
    habitRepo.listHabits(supabase, userId),
    mode === "off" ? Promise.resolve(null) : gamificationRepo.getState(supabase, userId),
  ]);

  const pending = tasks.filter((t) => t.status === "pending");
  const doneToday = tasks.filter(
    (t) => t.status === "completed" && t.completedAt && zonedDateString(new Date(t.completedAt), timezone) === today,
  ).length;

  const [subtasks, completions, quests] = await Promise.all([
    taskRepo.listSubtasksForTasks(
      supabase,
      pending.map((t) => t.id),
    ),
    habits.length > 0
      ? habitRepo.listCompletionsInRange(
          supabase,
          habits.map((h) => h.id),
          weekDates[0],
          weekDates[6],
        )
      : Promise.resolve([]),
    mode === "full" ? loadQuests(supabase, userId, today) : Promise.resolve<Quest[]>([]),
  ]);

  const subtasksByTask = groupSubtasks(subtasks);
  const stepCounts = Object.fromEntries(Object.entries(subtasksByTask).map(([id, list]) => [id, list.length]));

  /* What goes where */
  const topPick = recommendNext(pending, { now, timezone })?.task ?? null;
  const buckets = groupTasks(pending, now, timezone);
  const bosses = mode === "full" ? pending.filter((t) => t.isBoss) : [];
  const boss = bosses.filter((t) => t.id !== topPick?.id).sort(byDue)[0] ?? null;
  // Bosses have their own card; everything else (including the top pick) is on the plate.
  const hidden = new Set<string>(bosses.map((b) => b.id));

  const important = [...buckets.upcoming, ...buckets.someday].filter((t) => t.importance >= 4).slice(0, 3);
  const isUrgent = (t: { priority: string }) => t.priority === "high" || t.priority === "critical";
  const plateAll = [...buckets.earlier, ...buckets.today, ...important].filter((t) => !hidden.has(t.id));
  // High priority goes straight to the top, like an emergency; the rest keep their order.
  const plate = [...plateAll.filter(isUrgent), ...plateAll.filter((t) => !isUrgent(t))];
  const plateIds = new Set(plate.map((t) => t.id));
  const comingUp = [...buckets.upcoming, ...buckets.someday].filter((t) => !hidden.has(t.id) && !plateIds.has(t.id));

  // The ring matches what you see on your plate: done today vs. still on the plate.
  const dueNow = plate.length;

  /* Habits */
  const habitItems: HabitToday[] = habits.map((habit) => {
    const mine = completions.filter((c) => c.habitId === habit.id);
    const doneTodayForHabit = mine.some((c) => c.date === today && c.status !== "skipped");
    return { habit, doneToday: doneTodayForHabit, weekCount: weeklyProgress(mine, weekDates).completedCount };
  });

  /* Returning after time away */
  const level = game ? levelProgress(game.xp).level : 1;
  const comeback = game ? isComeback(game.lastActivityAt, now) : false;
  const gentleStart = comeback ? (recommendTop(pending, { now, availableMinutes: 15, timezone }, 1)[0]?.task ?? null) : null;

  const firstName = profile.displayName?.trim().split(/\s+/)[0] ?? null;
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  }).format(now);

  /* Welcome back after a gap: one small win, everything else parked */
  const late = waitingTasks(pending, now);
  const awayStart =
    pending.length > 0
      ? welcomeBackStart(
          {
            lastSeenAt: profile.lastSeenAt,
            awaySince: profile.awaySince,
            welcomeDismissedOn: profile.welcomeDismissedOn,
            waitingCount: late.length,
          },
          now,
          timezone,
        )
      : null;
  const seenRecently = profile.lastSeenAt && now.getTime() - new Date(profile.lastSeenAt).getTime() < 5 * 60_000;
  if (awayStart !== profile.awaySince || !seenRecently) {
    await updateProfile(supabase, userId, { lastSeenAt: now.toISOString(), awaySince: awayStart });
  }
  const recentMove = await latestUndoableShift(supabase, userId, new Date(now.getTime() - UNDO_HOURS * 3_600_000));
  const undo = recentMove ? { shiftId: recentMove.id, moved: recentMove.changes.length } : null;

  if (awayStart) {
    const win = pickOneWin(pending, now);
    return (
      <div className="mx-auto w-full max-w-3xl">
        <SessionPing />
        <WelcomeBackMode
          daysAway={calendarDaysBetween(new Date(awayStart), now, timezone)}
          hasLateTasks={late.length > 0}
          undo={undo}
          oneWin={
            win
              ? {
                  id: win.id,
                  title: win.title,
                  minutes: win.estimatedMinutes,
                  label: timeLabel(win, now, timezone),
                  firstStep: subtasksByTask[win.id]?.find((s) => !s.completed)?.title ?? null,
                }
              : null
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SessionPing />
      {undo && (
        <div className="mb-6">
          <UndoMoveBar shiftId={undo.shiftId} moved={undo.moved} />
        </div>
      )}

      <header className="animate-rise mb-8 flex items-end justify-between gap-6 sm:mb-10">
        <div>
          <p className="text-eyebrow text-muted-foreground">{dateLabel}</p>
          <h1 className="mt-2 font-display text-5xl leading-[1.02] text-balance sm:text-7xl">
            {greeting(zonedHour(now, timezone))}
            {firstName ? (
              <>
                , <em className="text-brand">{firstName}</em>
              </>
            ) : null}
            .
          </h1>
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-6 xl:col-start-1">
          {mode !== "off" && (
            <WelcomeBack
              active={comeback}
              level={level}
              suggestion={
                gentleStart
                  ? { id: gentleStart.id, title: gentleStart.title, minutes: gentleStart.estimatedMinutes }
                  : null
              }
            />
          )}

          {needsRescue(tasks, now) && (
            <div className="animate-rise flex flex-col gap-4 rounded-3xl bg-tint-butter p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card/70">
                  <LifeBuoy size={18} />
                </span>
                <div>
                  <p className="font-medium">Things have piled up a bit.</p>
                  <p className="text-sm text-foreground/70">Let&apos;s pick a few and get moving. Everything else can wait.</p>
                </div>
              </div>
              <Link href="/rescue" className={buttonVariants({ variant: "default" })}>
                Get back on track <ArrowRight />
              </Link>
            </div>
          )}

          <WhatsNextHero tasks={pending} stepCounts={stepCounts} nowIso={now.toISOString()} level={level} />
        </div>

        <aside className="space-y-5 xl:col-start-2 xl:row-span-3 xl:row-start-1">
          <TodayProgress done={doneToday} remaining={dueNow} />

          {quests.length > 0 && <QuestCard quests={quests} />}
          {boss && <BossCard task={boss} steps={subtasksByTask[boss.id] ?? []} />}
        </aside>

        <section aria-labelledby="plate" className="space-y-4 xl:col-start-1">
          <div className="flex items-end justify-between gap-4">
            <h2 id="plate" className="font-display text-3xl">
              On your plate
            </h2>
            {plate.length > 0 && <span className="text-sm text-muted-foreground tabular-nums">{plate.length}</span>}
          </div>
          <TaskList
            tasks={plate}
            subtasksByTask={subtasksByTask}
            nowIso={now.toISOString()}
            empty={
              <p className="rounded-3xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
                {pending.length === 0 ? "You're clear for now. Add something whenever it comes to mind." : "Nothing else is due today."}
              </p>
            }
          />
        </section>

        <div className="space-y-10 xl:col-start-1">
          {habits.length > 0 ? (
            <TodayHabits items={habitItems} today={today} />
          ) : (
            <section className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-border p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Add one habit you&apos;d like to keep.</p>
                <p className="text-sm text-muted-foreground">One is plenty. You can always add more later.</p>
              </div>
              <Link href="/habits" className={buttonVariants({ variant: "outline" })}>
                <Plus /> Start a habit
              </Link>
            </section>
          )}

          {comingUp.length > 0 && (
            <section aria-labelledby="coming-up" className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 id="coming-up" className="font-display text-3xl">
                  Coming up
                </h2>
                <Link href="/tasks" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  All tasks <ArrowRight size={14} />
                </Link>
              </div>
              <TaskList tasks={comingUp.slice(0, 4)} subtasksByTask={subtasksByTask} nowIso={now.toISOString()} />
            </section>
          )}
        </div>
      </div>
      <div className="mt-12 flex justify-center">
        <PretendAwayButton />
      </div>
    </div>
  );
}

const byDue = (a: { dueAt: string | null }, b: { dueAt: string | null }) =>
  (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity);

async function loadQuests(supabase: SupabaseClient, userId: string, date: string): Promise<Quest[]> {
  await Promise.all([ensureDailyQuest(supabase, userId, date), ensureSideQuest(supabase, userId, date)]);
  return gamificationRepo.listQuestsForDate(supabase, userId, date);
}
