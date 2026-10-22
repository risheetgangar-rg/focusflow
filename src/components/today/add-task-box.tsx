"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { addTaskAction } from "@/app/(dashboard)/today/card-actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Input } from "@/components/ui/input";
import { guessTaskType } from "@/lib/tasks/personal";
import { cn } from "@/lib/utils";

const WHEN = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
  { value: "someday", label: "Someday" },
] as const;

/** One box to add a task: type it, then tap when. Bills also ask for the amount. */
export function AddTaskBox() {
  const { notify } = useCelebration();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [mustDo, setMustDo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isBill = title.trim() !== "" && guessTaskType(title) === "bills";

  function add(when: (typeof WHEN)[number]["value"]) {
    if (!title.trim()) {
      setError("Type the task first.");
      return;
    }
    startTransition(async () => {
      const result = await addTaskAction({ title, when, amount: isBill ? amount : undefined, mustDo });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      notify({ title: "Added", detail: title.trim() });
      setTitle("");
      setAmount("");
      setMustDo(false);
      setError(null);
    });
  }

  return (
    <section aria-labelledby="add-task" className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 id="add-task" className="font-medium">
        Add a task
      </h2>
      <div className="mt-3 flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?"
          aria-label="Task"
          maxLength={200}
          className="h-12 flex-1 text-base"
        />
        <button
          type="button"
          onClick={() => setMustDo((v) => !v)}
          aria-pressed={mustDo}
          aria-label="Must do"
          title="Must do"
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-xl border border-input transition-colors",
            mustDo ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <Star size={18} />
        </button>
      </div>
      {isBill && (
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="How much? (optional)"
          aria-label="Amount"
          maxLength={40}
          className="mt-2 h-11"
        />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {WHEN.map((w) => (
          <button
            key={w.value}
            type="button"
            disabled={pending}
            onClick={() => add(w.value)}
            className="h-10 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-foreground/25 hover:bg-muted disabled:opacity-50"
          >
            {w.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-muted-foreground">{error}</p>}
    </section>
  );
}
