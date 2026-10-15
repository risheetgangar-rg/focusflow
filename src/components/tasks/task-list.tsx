"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { TaskEditorDialog } from "./task-editor-dialog";
import { TaskItem } from "./task-item";
import type { Subtask, Task } from "@/types/task";

/**
 * A list of tasks with one shared editor dialog. Rows slide away smoothly when
 * they're completed, moved, or deleted.
 */
export function TaskList({
  tasks,
  subtasksByTask,
  nowIso,
  empty,
}: {
  tasks: Task[];
  subtasksByTask: Record<string, Subtask[]>;
  nowIso: string;
  empty?: React.ReactNode;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = tasks.find((t) => t.id === editingId) ?? null;

  if (tasks.length === 0) {
    return <>{empty ?? <p className="py-6 text-sm text-muted-foreground">You&apos;re clear for now.</p>}</>;
  }

  return (
    <>
      <ul className="space-y-2.5">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <m.li
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="list-none"
            >
              <TaskItem
                task={task}
                subtasks={subtasksByTask[task.id] ?? []}
                nowIso={nowIso}
                onOpen={(t) => setEditingId(t.id)}
              />
            </m.li>
          ))}
        </AnimatePresence>
      </ul>

      <TaskEditorDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditingId(null)}
        task={editing}
        subtasks={editing ? (subtasksByTask[editing.id] ?? []) : []}
      />
    </>
  );
}
