"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { Bell, CalendarClock, ChevronDown, Hourglass, MoreHorizontal, Moon, Star, Target } from "lucide-react";
import {
  cancelTaskAction,

  rescheduleTaskAction,
  restoreTaskAction,
  snoozeTaskAction,
  undoCompleteTaskAction,
} from "@/app/(dashboard)/tasks/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { useApp } from "@/components/providers/app-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { describeDue } from "@/lib/dates/format";
import { cn } from "@/lib/utils";
import { isWaiting } from "@/services/recommendation-service";
import { announceTaskDone } from "@/components/today/today-progress";
import { finishTaskAction } from "@/app/(dashboard)/today/card-actions";
import { announceWin } from "@/components/rewards/win-layer";
import { StepsEditor } from "./steps-editor";
import { URGENCY_STYLE, UrgencyChip, useUrgency } from "./urgency-chip";
import { canWaitFor, useWaitingMode } from "./waiting-mode";
import type { Subtask, Task } from "@/types/task";

// Past dates are calm and neutral, never alarming.
const DUE_VARIANT = { past: "secondary", today: "secondary", soon: "secondary", later: "secondary" } as const;

export function TaskItem({
  task,
  subtasks,
  nowIso,
  onOpen,
}: {
  task: Task;
  subtasks: Subtask[];
  /** Server time when the page rendered; keeps due labels identical on server and client. */
  nowIso: string;
  onOpen: (task: Task) => void;
}) {
  const { timezone } = useApp();
  const { notify } = useCelebration();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const startWaiting = useWaitingMode();
  const isReminder = task.kind === "reminder";
  const [optimisticDone, setOptimisticDone] = useOptimistic(task.status === "completed");

  const now = new Date(nowIso);
  const due = task.dueAt ? describeDue(task.dueAt, now, timezone) : null;
  // Urgency comes from the deadline (and the Must do star), never set by hand.
  const urgency = useUrgency(task, nowIso);
  // Snoozed, or planned for later than its due date: say when it's coming back.
  const plan = task.scheduledAt && task.scheduledAt !== task.dueAt && isWaiting(task, now) ? describeDue(task.scheduledAt, now, timezone) : null;
  const planLabel = plan ? (plan.tone === "today" ? `Back at ${plan.label.split(" · ")[1] ?? "later"}` : `Planned ${plan.label}`) : null;
  const doneSteps = subtasks.filter((s) => s.completed).length;

  function toggleDone(checked: boolean) {
    // Outside the transition, so the Today ring moves right away instead of after the save.
    announceTaskDone(checked ? 1 : -1);
    startTransition(async () => {
      setOptimisticDone(checked);
      if (!checked) {
        await undoCompleteTaskAction(task.id);
        return;
      }
      const win = await finishTaskAction(task.id);
      announceWin(win);
      notify({ title: "Marked done", detail: task.title, action: { label: "Undo", onClick: () => void undoCompleteTaskAction(task.id) } });
    });
  }

  function move(target: "later_today" | "tomorrow" | "this_week", label: string) {
    startTransition(async () => {
      await rescheduleTaskAction(task.id, target);
      notify({ title: label, detail: task.title });
    });
  }

  function remove() {
    startTransition(async () => {
      await cancelTaskAction(task.id);
      notify({
        title: "Task deleted",
        detail: task.title,
        action: { label: "Undo", onClick: () => void restoreTaskAction(task.id) },
      });
    });
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-l-4 border-border bg-card px-4 py-3.5 transition-all duration-200 hover:-translate-y-px hover:shadow-soft",
        !optimisticDone && !isReminder && URGENCY_STYLE[urgency].edge,
        optimisticDone && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3.5">
        <Checkbox
          checked={optimisticDone}
          onCheckedChange={(checked) => toggleDone(checked === true)}
          aria-label={`Mark "${task.title}" ${optimisticDone ? "not done" : "done"}`}
          className="mt-0.5"
        />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(task)}
            className={cn(
              "block w-full text-left text-[0.95rem] leading-snug font-medium transition-colors hover:text-brand",
              optimisticDone && "text-muted-foreground line-through decoration-1",
            )}
          >
            {task.title}
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {due && (
              <Badge variant={DUE_VARIANT[due.tone]}>
                <CalendarClock /> {due.label}
              </Badge>
            )}
            {/* Kept to the few things that matter at a glance; the rest lives in Edit details. */}
            {planLabel && (
              <Badge variant="sky">
                <Moon /> {planLabel}
              </Badge>
            )}
            {isReminder ? (
              <Badge variant="sky">
                <Bell /> Reminder
              </Badge>
            ) : (
              !optimisticDone && <UrgencyChip urgency={urgency} />
            )}
            {task.mustDo && (
              <Badge variant="secondary">
                <Star /> Must do
              </Badge>
            )}
            {task.description?.startsWith("Sample task") && <Badge variant="outline">Sample</Badge>}
            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="inline-flex h-6 items-center gap-1 rounded-full bg-secondary px-2.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
              >
                {doneSteps === subtasks.length ? "Steps done" : "Steps"}
                <ChevronDown size={12} className={cn("transition-transform", expanded && "rotate-180")} />
              </button>
            )}
          </div>

        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {!optimisticDone && !isReminder && (
            <Link
              href={`/today?focus=${task.id}`}
              aria-label={`Focus on "${task.title}"`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-all hover:bg-brand-soft hover:text-brand"
            >
              <Target size={15} /> <span className="hidden sm:inline">Focus on this</span>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={`More for "${task.title}"`}>
                  <MoreHorizontal />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onOpen(task)}>Edit details</DropdownMenuItem>
              {startWaiting && !optimisticDone && canWaitFor(task, now) && (
                <DropdownMenuItem onClick={() => startWaiting(task)}>
                  <Hourglass /> Waiting mode
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => startTransition(() => snoozeTaskAction(task.id, 60))}>
                Snooze for an hour
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => move("later_today", "Moved to later today")}>Later today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => move("tomorrow", "Moved to tomorrow")}>Tomorrow</DropdownMenuItem>
              <DropdownMenuItem onClick={() => move("this_week", "Moved to this weekend")}>This week</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={remove}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            key="steps"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t pt-4 pl-9">
              <StepsEditor task={task} subtasks={subtasks} />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
