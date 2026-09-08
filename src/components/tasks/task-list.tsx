import { TaskItem } from "./task-item";
import type { Subtask, Task } from "@/types/task";

export function TaskList({ tasks, subtasksByTask }: { tasks: Task[]; subtasksByTask: Map<string, Subtask[]> }) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground">You&apos;re clear for now.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} subtasks={subtasksByTask.get(task.id) ?? []} />
      ))}
    </div>
  );
}
