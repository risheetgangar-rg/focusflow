import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { TaskList } from "@/components/tasks/task-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Subtask, Task } from "@/types/task";

export default async function TasksPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">Connect Supabase to manage tasks here.</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const tasks = await taskRepo.listTasks(supabase, user.id);
  const subtasks = await taskRepo.listSubtasksForTasks(
    supabase,
    tasks.map((t) => t.id),
  );
  const subtasksByTask = new Map<string, Subtask[]>();
  for (const subtask of subtasks) {
    const list = subtasksByTask.get(subtask.taskId) ?? [];
    list.push(subtask);
    subtasksByTask.set(subtask.taskId, list);
  }

  const active = tasks.filter((t: Task) => t.status === "pending");
  const completed = tasks.filter((t: Task) => t.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <NewTaskButton />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <TaskList tasks={active} subtasksByTask={subtasksByTask} />
        </TabsContent>
        <TabsContent value="completed">
          <TaskList tasks={completed} subtasksByTask={subtasksByTask} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
