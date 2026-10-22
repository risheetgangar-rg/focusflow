"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useQuickAdd } from "@/components/layout/quick-add-provider";
import { useApp } from "@/components/providers/app-context";
import { TaskList } from "@/components/tasks/task-list";
import { WaitingModeProvider } from "@/components/tasks/waiting-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillGroup } from "@/components/ui/pill-group";
import { BUCKET_LABELS, BUCKET_ORDER, groupTasks, type TaskBucket } from "@/lib/tasks/group";
import { cn } from "@/lib/utils";
import type { Subtask, Task } from "@/types/task";

type Filter = "all" | "today" | "important" | "quick" | "boss";

function matchesFilter(task: Task, bucket: TaskBucket, filter: Filter): boolean {
  switch (filter) {
    case "today":
      return bucket === "earlier" || bucket === "today";
    case "important":
      return task.importance >= 4 || task.priority === "high" || task.priority === "critical";
    case "quick":
      return task.estimatedMinutes !== null && task.estimatedMinutes <= 15;
    case "boss":
      return task.isBoss;
    default:
      return true;
  }
}

/** Search, filter, and browse every task, grouped by when it's due. */
export function TasksView({
  tasks,
  subtasksByTask,
  nowIso,
}: {
  tasks: Task[];
  subtasksByTask: Record<string, Subtask[]>;
  nowIso: string;
}) {
  const { timezone, mode } = useApp();
  const { openCapture } = useQuickAdd();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showDone, setShowDone] = useState(false);

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all = groupTasks(tasks, new Date(nowIso), timezone);
    const result = {} as Record<TaskBucket, Task[]>;
    for (const bucket of BUCKET_ORDER) {
      result[bucket] = all[bucket].filter(
        (t) => (!needle || t.title.toLowerCase().includes(needle)) && matchesFilter(t, bucket, filter),
      );
    }
    return result;
  }, [tasks, nowIso, timezone, query, filter]);

  const open = BUCKET_ORDER.filter((b) => b !== "done").reduce((sum, b) => sum + grouped[b].length, 0);
  const everything = tasks.some((t) => t.status !== "cancelled");
  const filtering = query.trim() !== "" || filter !== "all";

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "today", label: "Today" },
    { value: "important", label: "Important" },
    { value: "quick", label: "Quick wins" },
    ...(mode === "full" ? [{ value: "boss" as const, label: "Boss" }] : []),
  ];

  if (!everything) {
    return (
      <div className="rounded-[2rem] bg-tint-lavender px-6 py-14 text-center sm:py-20">
        <p className="font-display text-5xl">A clean slate.</p>
        <p className="mx-auto mt-3 max-w-sm text-foreground/70">
          Add the first thing that comes to mind. Messy is fine, you can sort it out later.
        </p>
        <Button size="lg" variant="default" className="mt-7" onClick={openCapture}>
          Add a task
        </Button>
      </div>
    );
  }

  return (
    <WaitingModeProvider tasks={tasks}>
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your tasks"
            aria-label="Search your tasks"
            className="h-12 rounded-full pl-10"
          />
        </div>
        <PillGroup
          name="task-filter"
          ariaLabel="Filter tasks"
          options={filters}
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
          optionClassName="h-9"
        />
      </div>

      {open === 0 && grouped.done.length === 0 && (
        <p className="rounded-3xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          {filtering ? "Nothing matches. Try another filter." : "You're clear for now."}
        </p>
      )}

      {BUCKET_ORDER.filter((b) => b !== "done" && grouped[b].length > 0).map((bucket) => (
        <section key={bucket} aria-labelledby={`bucket-${bucket}`} className="space-y-3.5">
          <div className="flex items-baseline gap-3">
            <h2 id={`bucket-${bucket}`} className="font-display text-3xl">
              {BUCKET_LABELS[bucket]}
            </h2>
          </div>
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
            <span className="text-sm text-muted-foreground tabular-nums">{grouped.done.length}</span>
            <ChevronDown size={18} className={cn("text-muted-foreground transition-transform", showDone && "rotate-180")} />
          </button>
          {showDone && <TaskList tasks={grouped.done} subtasksByTask={subtasksByTask} nowIso={nowIso} />}
        </section>
      )}
    </div>
    </WaitingModeProvider>
  );
}
