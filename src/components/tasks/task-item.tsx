"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  completeTaskAction,
  deleteTaskAction,
  rescheduleTaskAction,
  snoozeTaskAction,
  undoCompleteTaskAction,
} from "@/app/(dashboard)/tasks/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isOverdue } from "@/lib/dates/overdue";
import { TaskForm } from "./task-form";
import { SubtaskList } from "./subtask-list";
import { RewardFeedback } from "@/components/gamification/reward-feedback";
import { useRewardFeedback } from "@/components/gamification/use-reward-feedback";
import type { Subtask, Task } from "@/types/task";

const priorityVariant: Record<Task["priority"], "default" | "secondary" | "destructive"> = {
  low: "secondary",
  medium: "secondary",
  high: "default",
  critical: "destructive",
};

export function TaskItem({ task, subtasks }: { task: Task; subtasks: Subtask[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();
  const { reward, show } = useRewardFeedback();
  const overdue = isOverdue(task.dueAt, task.status);
  const completed = task.status === "completed";

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
          className="mt-0.5"
          onCheckedChange={(checked) =>
            startTransition(async () => {
              if (checked === true) {
                show(await completeTaskAction(task.id));
              } else {
                await undoCompleteTaskAction(task.id);
              }
            })
          }
        />
        <button
          type="button"
          className="text-muted-foreground mt-0.5"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse steps" : "Expand steps"}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <p className={completed ? "text-muted-foreground line-through" : "font-medium"}>
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
            {task.friction >= 4 && <Badge variant="outline">needs a push</Badge>}
            {overdue && <Badge variant="destructive">overdue</Badge>}
            {task.estimatedMinutes && (
              <span className="text-muted-foreground">{task.estimatedMinutes} min</span>
            )}
            {task.dueAt && (
              <span className="text-muted-foreground">
                due {new Date(task.dueAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <RewardFeedback reward={reward} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Task actions">
                <MoreHorizontal size={16} />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => startTransition(() => snoozeTaskAction(task.id, 60))}>
              Snooze 1 hour
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => startTransition(() => rescheduleTaskAction(task.id, "later_today"))}
            >
              Move to later today
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => startTransition(() => rescheduleTaskAction(task.id, "tomorrow"))}
            >
              Move to tomorrow
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => startTransition(() => rescheduleTaskAction(task.id, "this_week"))}
            >
              Move to this week
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => startTransition(() => deleteTaskAction(task.id))}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && <SubtaskList taskId={task.id} subtasks={subtasks} />}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          <TaskForm task={task} onSaved={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
