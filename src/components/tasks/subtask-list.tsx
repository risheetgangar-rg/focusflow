"use client";

import { useState, useTransition } from "react";
import { addSubtaskAction, deleteSubtaskAction, toggleSubtaskAction } from "@/app/(dashboard)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Subtask } from "@/types/task";

export function SubtaskList({ taskId, subtasks }: { taskId: string; subtasks: Subtask[] }) {
  const [newTitle, setNewTitle] = useState("");
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2 pl-8">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={subtask.completed}
            onCheckedChange={(checked) =>
              startTransition(() => toggleSubtaskAction(subtask.id, checked === true))
            }
          />
          <span className={subtask.completed ? "text-muted-foreground line-through" : ""}>
            {subtask.title}
          </span>
          <button
            type="button"
            className="text-muted-foreground ml-auto text-xs hover:underline"
            onClick={() => startTransition(() => deleteSubtaskAction(subtask.id))}
          >
            Remove
          </button>
        </div>
      ))}
      {subtasks.length < 7 && (
        <form
          className="flex gap-2"
          action={() => {
            if (!newTitle.trim()) return;
            startTransition(() => addSubtaskAction(taskId, newTitle, subtasks.length));
            setNewTitle("");
          }}
        >
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a step"
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" variant="outline">
            Add
          </Button>
        </form>
      )}
    </div>
  );
}
