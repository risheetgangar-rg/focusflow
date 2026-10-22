import type { Metadata } from "next";
import { VoiceAdd } from "@/components/tasks/voice-add";
import { TasksView } from "@/components/tasks/tasks-view";
import { requireSession } from "@/lib/auth/session";
import { groupSubtasks } from "@/lib/tasks/group";
import * as taskRepo from "@/repositories/task-repository";

export const metadata: Metadata = { title: "Tasks" };

const DAY_MS = 86_400_000;

export default async function TasksPage() {
  const { supabase, userId } = await requireSession();
  const now = new Date();

  const tasks = await taskRepo.listVisibleTasks(supabase, userId, new Date(now.getTime() - 14 * DAY_MS));
  const subtasks = await taskRepo.listSubtasksForTasks(
    supabase,
    tasks.map((t) => t.id),
  );

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="animate-rise mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        <div>
          <p className="text-eyebrow text-muted-foreground">Tasks and reminders</p>
          <h1 className="mt-2 font-display text-5xl leading-none sm:text-7xl">Tasks</h1>
        </div>

      </header>

      <div className="mb-10">
        <VoiceAdd />
      </div>

      <TasksView tasks={tasks} subtasksByTask={groupSubtasks(subtasks)} nowIso={now.toISOString()} />
    </div>
  );
}
