import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import * as habitRepo from "@/repositories/habit-repository";
import { computeDailyStats, computeWeeklyStats, getReflection } from "@/services/review-service";
import { getWeekDates, todayDateString, weeklyProgress } from "@/services/habit-service";
import { ReflectionForm } from "@/components/gamification/reflection-form";
import { RescheduleRemaining } from "@/components/gamification/reschedule-remaining";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReviewPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
        <p className="text-muted-foreground">Connect Supabase to see your review here.</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const tasks = await taskRepo.listTasks(supabase, user.id);
  const dailyStats = computeDailyStats(tasks, now);

  const weekDates = getWeekDates(now);
  const habits = await habitRepo.listHabits(supabase, user.id);
  const completions = await habitRepo.listCompletionsInRange(
    supabase,
    habits.map((h) => h.id),
    weekDates[0],
    weekDates[6],
  );

  const focusSessions = await supabase
    .from("focus_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completed", true)
    .gte("started_at", `${weekDates[0]}T00:00:00`)
    .lte("started_at", `${weekDates[6]}T23:59:59`);

  const weeklyStats = computeWeeklyStats(tasks, focusSessions.count ?? 0, weekDates[0], weekDates[6]);
  const reflection = await getReflection(supabase, user.id, todayDateString(now));

  const remainingTasks = tasks.filter((t) => t.status === "pending");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Review</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {dailyStats.completedCount} completed · {dailyStats.rescheduledCount} rescheduled ·{" "}
            {dailyStats.remainingCount} remaining
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {habits.map((habit) => {
            const progress = weeklyProgress(
              completions.filter((c) => c.habitId === habit.id),
              weekDates,
            );
            return (
              <p key={habit.id}>
                {progress.completedCount}/{habit.targetCount} {habit.name.toLowerCase()} days
              </p>
            );
          })}
          <p>{weeklyStats.focusSessionCount} focus sessions</p>
          <p>{weeklyStats.importantCompletedCount} important tasks completed</p>
        </CardContent>
      </Card>

      <RescheduleRemaining taskIds={remainingTasks.map((t) => t.id)} />

      <ReflectionForm initialReflection={reflection} />
    </div>
  );
}
