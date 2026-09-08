import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import * as habitRepo from "@/repositories/habit-repository";
import { recommendNext } from "@/services/recommendation-service";
import { getWeekDates } from "@/services/habit-service";
import { needsRescue } from "@/services/rescue-service";
import { ensureDailyQuest, ensureSideQuest } from "@/services/quest-service";
import { todayDateString } from "@/services/habit-service";
import { isDueToday } from "@/lib/dates/overdue";
import { WhatsNextCard } from "@/components/today/whats-next-card";
import { TaskList } from "@/components/tasks/task-list";
import { HabitCard } from "@/components/habits/habit-card";
import { QuestCard } from "@/components/gamification/quest-card";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getProfile } from "@/repositories/profile-repository";
import * as gamificationRepo from "@/repositories/gamification-repository";
import type { Subtask, Task } from "@/types/task";

function greeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const now = new Date();

  if (!supabase || !user) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{greeting(now)}</h1>
        <p className="text-muted-foreground">Connect Supabase to see your tasks here.</p>
      </div>
    );
  }

  const tasks = await taskRepo.listTasks(supabase, user.id);
  const pending = tasks.filter((t) => t.status === "pending");
  const recommendation = recommendNext(tasks, { now });

  const importantToday = pending.filter(
    (t) => t.id !== recommendation?.task.id && (t.importance >= 4 || isDueToday(t.dueAt, now)),
  );
  const later = pending.filter(
    (t) => t.id !== recommendation?.task.id && !importantToday.some((i) => i.id === t.id),
  );

  const subtasks = await taskRepo.listSubtasksForTasks(
    supabase,
    pending.map((t) => t.id),
  );
  const subtasksByTask = new Map<string, Subtask[]>();
  for (const s of subtasks) {
    subtasksByTask.set(s.taskId, [...(subtasksByTask.get(s.taskId) ?? []), s]);
  }

  const habits = await habitRepo.listHabits(supabase, user.id);
  const weekDates = getWeekDates(now);
  const completions = await habitRepo.listCompletionsInRange(
    supabase,
    habits.map((h) => h.id),
    weekDates[0],
    weekDates[6],
  );

  const profile = await getProfile(supabase, user.id);
  let quests: Awaited<ReturnType<typeof gamificationRepo.listQuestsForDate>> = [];
  if (profile?.gamificationMode === "full") {
    const dateStr = todayDateString(now);
    await Promise.all([
      ensureDailyQuest(supabase, user.id, dateStr),
      ensureSideQuest(supabase, user.id, dateStr),
    ]);
    quests = await gamificationRepo.listQuestsForDate(supabase, user.id, dateStr);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{greeting(now)}</h1>

      {needsRescue(tasks, now) && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Things have piled up a bit. Let&apos;s pick a few and get moving.
            </p>
            <Link href="/rescue" className={buttonVariants({ size: "sm" })}>
              Get back on track
            </Link>
          </CardContent>
        </Card>
      )}

      <WhatsNextCard recommendation={recommendation} />

      {quests.length > 0 && <QuestCard quests={quests} />}

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Important today
        </h2>
        <TaskList tasks={importantToday as Task[]} subtasksByTask={subtasksByTask} />
      </section>

      {habits.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Habits
          </h2>
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
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Later
        </h2>
        <TaskList tasks={later as Task[]} subtasksByTask={subtasksByTask} />
        <Link href="/tasks" className="text-muted-foreground text-sm hover:underline">
          View all tasks →
        </Link>
      </section>
    </div>
  );
}
