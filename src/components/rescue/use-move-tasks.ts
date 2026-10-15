"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleRestAction } from "@/app/(dashboard)/rescue/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import type { RescheduleTarget } from "@/services/task-service";

export type MoveTarget = Exclude<RescheduleTarget, "custom">;

export interface MoveChoice {
  target: MoveTarget;
  label: string;
  /** A few words under the label. */
  hint: string;
  /** Finishes the sentence "will wait for you ...". */
  when: string;
}

export const MOVE_CHOICES: MoveChoice[] = [
  { target: "tomorrow", label: "Tomorrow", hint: "morning", when: "tomorrow morning" },
  { target: "this_week", label: "This week", hint: "by Sunday", when: "by Sunday" },
  { target: "later_today", label: "Later", hint: "today", when: "later today" },
];

/**
 * Moves a set of tasks somewhere kinder (tomorrow, this week, later today),
 * celebrates whatever that earned, and remembers that it happened. The server
 * only changes the tasks' schedule, so the tasks may still be listed
 * afterwards. `movedWhen` lets the screen say "all set" instead of offering the
 * same buttons again.
 */
export function useMoveTasks(taskIds: string[]) {
  const router = useRouter();
  const { celebrate, notify } = useCelebration();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<MoveTarget | null>(null);
  const [moved, setMoved] = useState<{ key: string; when: string } | null>(null);

  const count = taskIds.length;
  const key = taskIds.join(",");
  const noun = count === 1 ? "task" : "tasks";

  function move(item: MoveChoice) {
    setChoice(item.target);
    startTransition(async () => {
      try {
        const outcome = await rescheduleRestAction(taskIds, item.target);
        celebrate(outcome);
        notify({ title: `Moved to ${item.label.toLowerCase()}`, detail: `${count} ${noun}` });
        setMoved({ key, when: item.when });
        router.refresh();
      } catch {
        notify({ title: "Couldn't move those", detail: "Give it another try in a moment." });
      }
    });
  }

  return {
    count,
    noun,
    pending,
    choice,
    move,
    /** Set only for the exact group of tasks that was just moved. */
    movedWhen: moved?.key === key ? moved.when : null,
  };
}
