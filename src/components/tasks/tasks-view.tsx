"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { TaskList } from "@/components/tasks/task-list";
import { WaitingModeProvider } from "@/components/tasks/waiting-mode";
import { TONE_LABEL, TONE_ORDER, TONE_STYLE, toneOf, type Tone } from "@/lib/tasks/tone";
import { cn } from "@/lib/utils";
import type { Subtask, Task } from "@/types/task";

const byDue = (a: Task, b: Task) =>
  (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity);

/** The colour key, so rows don't need labels. */
function ColourKey() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground" aria-label="Colour key">
      {TONE_ORDER.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-full", TONE_STYLE[t].dot)} aria-hidden />
          {TONE_LABEL[t]}
        </li>
      ))}
    </ul>
  );
}

function Group({
  id,
  title,
  hint,
  tasks,
  subtasksByTask,
  nowIso,
  small,
}: {
  id: string;
  title: string;
  hint?: string;
  tasks: Task[];
  subtasksByTask: Record<string, Subtask[]>;
  nowIso: string;
  small?: boolean;
}) {
  if (tasks.length === 0) return null;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div>
        <h3 id={id} className={small ? "text-eyebrow text-muted-foreground" : "font-display text-3xl"}>
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <TaskList tasks={tasks} subtasksByTask={subtasksByTask} nowIso={nowIso} />
    </section>
  );
}

/**
 * Reminders, then the two kinds of task: Non-negotiables (things on a rhythm,
 * like laundry) and New stuff (one-offs), sorted by colour so the urgent
 * ones are on top. Done is tucked away at the bottom.
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
  const [showDone, setShowDone] = useState(false);

  const groups = useMemo(() => {
    const now = new Date(nowIso);
    const open = tasks.filter((t) => t.status === "pending");
    const reminders = open.filter((t) => t.kind === "reminder").sort(byDue);
    const work = open.filter((t) => t.kind !== "reminder");
    const routine = work.filter((t) => t.recurrenceRule).sort(byDue);
    const fresh = work.filter((t) => !t.recurrenceRule);
    const tone = (want: Tone) => fresh.filter((t) => toneOf(t, now) === want).sort(byDue);
    return {
      reminders,
      routine,
      parked: tone("parked"),
      now: tone("now"),
      // Coming up: yellow first, then green.
      comingUp: [...tone("soon"), ...tone("later")],
      done: tasks.filter((t) => t.status === "completed").sort((a, b) => Date.parse(b.completedAt ?? "") - Date.parse(a.completedAt ?? "")),
      freshCount: fresh.length,
    };
  }, [tasks, nowIso]);

  if (!tasks.some((t) => t.status !== "cancelled")) {
    return (
      <p className="rounded-3xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
        A clean slate. Say or type the first thing on your mind above.
      </p>
    );
  }

  const shared = { subtasksByTask, nowIso };
  return (
    <WaitingModeProvider tasks={tasks}>
      <div className="space-y-10">
        <ColourKey />

        <Group id="g-reminders" title="Reminders" tasks={groups.reminders} {...shared} />

        <Group
          id="g-routine"
          title="Non-negotiables"
          hint="Things on a rhythm, like laundry: every day, or a few times a week."
          tasks={groups.routine}
          {...shared}
        />

        {groups.freshCount > 0 && (
          <section aria-labelledby="g-fresh" className="space-y-6">
            <div>
              <h2 id="g-fresh" className="font-display text-3xl">
                New stuff
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">One-off things you need to get done.</p>
            </div>
            <Group id="g-parked" title="Parked" hint="Its day passed, but it's still worth doing." tasks={groups.parked} small {...shared} />
            <Group id="g-now" title="Work on it right now" tasks={groups.now} small {...shared} />
            <Group id="g-coming" title="Coming up" tasks={groups.comingUp} small {...shared} />
          </section>
        )}

        {groups.done.length > 0 && (
          <section aria-labelledby="g-done" className="space-y-3.5">
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              aria-expanded={showDone}
              className="flex items-center gap-3 rounded-full text-left"
            >
              <h2 id="g-done" className="font-display text-3xl">
                Done
              </h2>
              <ChevronDown size={18} className={cn("text-muted-foreground transition-transform", showDone && "rotate-180")} />
            </button>
            {showDone && <TaskList tasks={groups.done} {...shared} />}
          </section>
        )}
      </div>
    </WaitingModeProvider>
  );
}
