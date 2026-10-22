"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/components/providers/app-context";
import { TaskList } from "@/components/tasks/task-list";
import { WaitingModeProvider } from "@/components/tasks/waiting-mode";
import { BUCKET_LABELS, BUCKET_ORDER, groupTasks } from "@/lib/tasks/group";
import { cn } from "@/lib/utils";
import type { Subtask, Task } from "@/types/task";

/**
 * Kept plain on purpose: reminders on top (in time order), then tasks grouped
 * by when they're due, and what's done tucked away at the bottom.
 */
export function TasksView({
  tasks,
  subtasksByTask,
  nowIso,
}: {
  tasks: Task[];
  subtasksByTask: Record<string, Subtask[]>;
  nowIso: string;
}) {
  const { timezone } = useApp();
  const [showDone, setShowDone] = useState(false);

  const reminders = useMemo(
    () =>
      tasks
        .filter((t) => t.kind === "reminder" && t.status === "pending")
        .sort((a, b) => Date.parse(a.dueAt ?? "") - Date.parse(b.dueAt ?? "")),
    [tasks],
  );
  const grouped = useMemo(
    () => groupTasks(tasks.filter((t) => t.kind !== "reminder" || t.status === "completed"), new Date(nowIso), timezone),
    [tasks, nowIso, timezone],
  );

  if (!tasks.some((t) => t.status !== "cancelled")) {
    return (
      <p className="rounded-3xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
        A clean slate. Say or type the first thing on your mind above.
      </p>
    );
  }

  return (
    <WaitingModeProvider tasks={tasks}>
      <div className="space-y-8">
        {reminders.length > 0 && (
          <section aria-labelledby="bucket-reminders" className="space-y-3.5">
            <h2 id="bucket-reminders" className="font-display text-3xl">
              Reminders
            </h2>
            <TaskList tasks={reminders} subtasksByTask={subtasksByTask} nowIso={nowIso} />
          </section>
        )}

        {BUCKET_ORDER.filter((b) => b !== "done" && grouped[b].length > 0).map((bucket) => (
          <section key={bucket} aria-labelledby={`bucket-${bucket}`} className="space-y-3.5">
            <h2 id={`bucket-${bucket}`} className="font-display text-3xl">
              {BUCKET_LABELS[bucket]}
            </h2>
            <TaskList tasks={grouped[bucket]} subtasksByTask={subtasksByTask} nowIso={nowIso} />
          </section>
        ))}

        {grouped.done.length > 0 && (
          <section aria-labelledby="bucket-done" className="space-y-3.5">
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              aria-expanded={showDone}
              className="flex items-center gap-3 rounded-full text-left"
            >
              <h2 id="bucket-done" className="font-display text-3xl">
                {BUCKET_LABELS.done}
              </h2>
              <ChevronDown size={18} className={cn("text-muted-foreground transition-transform", showDone && "rotate-180")} />
            </button>
            {showDone && <TaskList tasks={grouped.done} subtasksByTask={subtasksByTask} nowIso={nowIso} />}
          </section>
        )}
      </div>
    </WaitingModeProvider>
  );
}
