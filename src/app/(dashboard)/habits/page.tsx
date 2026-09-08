import { createClient } from "@/lib/supabase/server";
import * as habitRepo from "@/repositories/habit-repository";
import { getWeekDates } from "@/services/habit-service";
import { HabitCard } from "@/components/habits/habit-card";
import { NewHabitButton } from "@/components/habits/new-habit-button";

export default async function HabitsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        <p className="text-muted-foreground">Connect Supabase to track habits here.</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const habits = await habitRepo.listHabits(supabase, user.id);
  const weekDates = getWeekDates(new Date());
  const completions = await habitRepo.listCompletionsInRange(
    supabase,
    habits.map((h) => h.id),
    weekDates[0],
    weekDates[6],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        <NewHabitButton />
      </div>

      {habits.length === 0 ? (
        <p className="text-muted-foreground">Add one habit you&apos;d like to keep.</p>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completions={completions.filter((c) => c.habitId === habit.id)}
              weekDates={weekDates}
            />
          ))}
        </div>
      )}
    </div>
  );
}
