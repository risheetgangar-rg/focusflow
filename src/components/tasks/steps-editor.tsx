"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, m } from "motion/react";
import { Plus, Sparkles, Swords, X } from "lucide-react";
import {
  addSubtaskAction,
  applyBreakdownAction,
  deleteSubtaskAction,
  toggleSubtaskAction,
} from "@/app/(dashboard)/tasks/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { bossStatus } from "@/lib/tasks/boss";
import { MAX_STEPS, getTaskBreaker } from "@/lib/tasks/task-breaker";
import { cn } from "@/lib/utils";
import type { Subtask, Task } from "@/types/task";

/**
 * The steps ("phases" for a Boss Task) of a task: tick them off, add your own,
 * or ask for a suggested breakdown — which is always shown for editing first
 * and never saved without a click.
 */
export function StepsEditor({ task, subtasks }: { task: Task; subtasks: Subtask[] }) {
  const { celebrate, notify } = useCelebration();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const boss = task.isBoss ? bossStatus(subtasks) : null;
  const canAdd = subtasks.length < MAX_STEPS;

  function addStep() {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    startTransition(() => addSubtaskAction(task.id, title, subtasks.length));
  }

  function suggest() {
    setSuggestions(getTaskBreaker().suggest({ title: task.title }).slice(0, MAX_STEPS - subtasks.length));
  }

  function saveSuggestions() {
    const steps = (suggestions ?? []).map((s) => s.trim()).filter(Boolean);
    if (steps.length === 0) return;
    startTransition(async () => {
      const result = await applyBreakdownAction(task.id, steps);
      if (result.ok) {
        setSuggestions(null);
        notify({ title: "Steps added", detail: `${steps.length} small steps to start with` });
      } else {
        notify({ title: result.error ?? "Couldn't add those steps" });
      }
    });
  }

  return (
    <div className="space-y-3">
      {boss && (
        <div className="space-y-2 rounded-2xl bg-tint-rose p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              <Swords size={15} /> Boss HP
            </span>
            <span className="tabular-nums">{boss.hp} / 100</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-destructive transition-[width] duration-700 ease-out"
              style={{ width: `${boss.hp}%` }}
            />
          </div>
          {boss.total === 0 && (
            <p className="text-xs text-muted-foreground">Add a few steps. Each one you finish takes a bite out of it.</p>
          )}
        </div>
      )}

      <ul className="space-y-1.5" aria-label="Steps">
        <AnimatePresence initial={false}>
          {subtasks.map((step) => (
            <m.li
              key={step.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="group flex items-center gap-3 rounded-xl px-1 py-1"
            >
              <Checkbox
                checked={step.completed}
                aria-label={`Mark "${step.title}" ${step.completed ? "not done" : "done"}`}
                onCheckedChange={(checked) =>
                  startTransition(async () => celebrate(await toggleSubtaskAction(step.id, checked === true)))
                }
              />
              <span className={cn("flex-1 text-sm", step.completed && "text-muted-foreground line-through")}>
                {step.title}
              </span>
              <button
                type="button"
                aria-label={`Remove "${step.title}"`}
                onClick={() => startTransition(() => deleteSubtaskAction(step.id))}
                className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100"
              >
                <X size={14} />
              </button>
            </m.li>
          ))}
        </AnimatePresence>
      </ul>

      {suggestions ? (
        <div className="space-y-3 rounded-2xl border border-brand/30 bg-brand-soft/50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-brand">
            <Sparkles size={15} /> A way to start. Edit anything.
          </p>
          <div className="space-y-2">
            {suggestions.map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-card text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <Input
                  value={text}
                  aria-label={`Step ${i + 1}`}
                  onChange={(e) => setSuggestions((s) => s?.map((v, j) => (j === i ? e.target.value : v)) ?? null)}
                  className="h-10"
                />
                <button
                  type="button"
                  aria-label={`Remove step ${i + 1}`}
                  onClick={() => setSuggestions((s) => s?.filter((_, j) => j !== i) ?? null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="brand" onClick={saveSuggestions} disabled={pending || suggestions.length === 0}>
              Use these steps
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSuggestions(null)}>
              Not now
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {canAdd && (
            <form
              className="flex min-w-0 flex-1 items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addStep();
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={subtasks.length === 0 ? "Add a first small step" : "Add another step"}
                aria-label="New step"
                maxLength={200}
                className="h-10"
              />
              <Button type="submit" size="icon" variant="outline" aria-label="Add step" disabled={!draft.trim()}>
                <Plus />
              </Button>
            </form>
          )}
          {canAdd && subtasks.length === 0 && (
            <Button type="button" variant="soft" size="sm" onClick={suggest}>
              <Sparkles /> Break it down for me
            </Button>
          )}
          {!canAdd && <p className="text-xs text-muted-foreground">That&apos;s the max of {MAX_STEPS} steps. Keep it small.</p>}
        </div>
      )}
    </div>
  );
}
