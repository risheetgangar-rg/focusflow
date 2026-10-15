import type { Metadata } from "next";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitsEmpty } from "@/components/habits/habits-empty";
import { NewHabitButton } from "@/components/habits/new-habit-button";
import { WeekOverview } from "@/components/habits/week-overview";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import { requireSession } from "@/lib/auth/session";
import { addDaysToDateString, zonedDateString } from "@/lib/dates/tz";
import * as habitRepo from "@/repositories/habit-repository";
import { getWeekDates, todayDateString } from "@/services/habit-service";

export const metadata: Metadata = { title: "Habits" };

const HISTORY_WEEKS = 5;

export default async function HabitsPage() {
  const { supabase, userId, timezone, profile } = await requireSession();

  // Everything about "today" and "this week" is worked out here, in the person's timezone.
  const now = new Date();
  const today = todayDateString(now, timezone);
  const weekDates = getWeekDates(now, timezone);
  const historyStart = addDaysToDateString(weekDates[0], -7 * (HISTORY_WEEKS - 1));
  const historyDates = Array.from({ length: HISTORY_WEEKS * 7 }, (_, i) => addDaysToDateString(historyStart, i));

  const habits = await habitRepo.listHabits(supabase, userId);
  const completions = await habitRepo.listCompletionsInRange(
    supabase,
    habits.map((h) => h.id),
    historyStart,
    weekDates[6],
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="max-w-xl space-y-3">
            <p className="text-eyebrow">Habits</p>
            <h1 className="font-display text-4xl sm:text-5xl">
              Small things, <span className="italic">kept</span>.
            </h1>
            <p className="text-muted-foreground">
              A few days a week is plenty. Tap a day to mark it, tap again to change it.
            </p>
          </div>
          {habits.length > 0 && <NewHabitButton variant="default" size="lg" />}
        </header>
      </Reveal>

      {habits.length === 0 ? (
        <Reveal delay={0.1}>
          <HabitsEmpty showCompanion={profile.gamificationMode !== "off"} />
        </Reveal>
      ) : (
        <>
          <Reveal delay={0.08}>
            <WeekOverview habits={habits} completions={completions} weekDates={weekDates} today={today} />
          </Reveal>

          <Stagger className="grid gap-5 md:grid-cols-2" delay={0.15}>
            {habits.map((habit) => (
              <StaggerItem key={habit.id} className="h-full">
                <HabitCard
                  habit={habit}
                  completions={completions.filter((c) => c.habitId === habit.id)}
                  weekDates={weekDates}
                  today={today}
                  historyDates={historyDates}
                  startedOn={zonedDateString(new Date(habit.createdAt), timezone)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
    </div>
  );
}
