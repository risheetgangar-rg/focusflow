"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTaskAction } from "@/app/(dashboard)/tasks/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StepsEditor } from "./steps-editor";
import { TaskForm } from "./task-form";
import type { Subtask, Task } from "@/types/task";

/** Create a task (no `task`) or open one to edit, break down, or remove. */
export function TaskEditorDialog({
  open,
  onOpenChange,
  task,
  subtasks = [],
  defaultDueDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  subtasks?: Subtask[];
  defaultDueDate?: string;
}) {
  const { notify } = useCelebration();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function close(next: boolean) {
    if (!next) setConfirming(false);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription className="sr-only">
            {task ? "Change the details of this task." : "Add something to your list."}
          </DialogDescription>
        </DialogHeader>

        {/* key forces a fresh form (and fresh defaults) each time a different task opens */}
        <TaskForm key={task?.id ?? "new"} task={task} defaultDueDate={defaultDueDate} onSaved={() => close(false)} />

        {task && (
          <div className="space-y-5 border-t pt-5">
            <div>
              <h3 className="text-eyebrow mb-3">{task.isBoss ? "Boss phases" : "Steps"}</h3>
              <StepsEditor task={task} subtasks={subtasks} />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              {confirming ? (
                <div className="flex w-full items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Delete this for good?</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                      Keep it
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteTaskAction(task.id);
                          notify({ title: "Task deleted" });
                          close(false);
                        })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} className="text-muted-foreground">
                  <Trash2 /> Delete permanently
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
