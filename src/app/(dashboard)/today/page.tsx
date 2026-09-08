import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import { recommendNext } from "@/services/recommendation-service";
import { isDueToday } from "@/lib/dates/overdue";
import { WhatsNextCard } from "@/components/today/whats-next-card";
import { TaskList } from "@/components/tasks/task-list";
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

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{greeting(now)}</h1>

      <WhatsNextCard recommendation={recommendation} />

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Important today
        </h2>
        <TaskList tasks={importantToday as Task[]} subtasksByTask={subtasksByTask} />
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Later
        </h2>
        <TaskList tasks={later as Task[]} subtasksByTask={subtasksByTask} />
      </section>
    </div>
  );
}
