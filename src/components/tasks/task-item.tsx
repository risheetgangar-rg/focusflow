"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { CalendarClock, ChevronDown, Clock, MoreHorizontal, Moon, Play, Repeat, Swords, Zap } from "lucide-react";
import {
  cancelTaskAction,
  completeTaskAction,
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
import { bossStatus } from "@/lib/tasks/boss";
import { shouldSuggestBreakdown } from "@/lib/tasks/task-breaker";
import { cn } from "@/lib/utils";
import { isWaiting } from "@/services/recommendation-service";
import { StepsEditor } from "./steps-editor";
import type { Subtask, Task } from "@/types/task";

const DUE_VARIANT = { past: "butter", today: "brand", soon: "lavender", later: "secondary" } as const;

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
  const { celebrate, notify } = useCelebration();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [optimisticDone, setOptimisticDone] = useOptimistic(task.status === "completed");

  const now = new Date(nowIso);
  const due = task.dueAt ? describeDue(task.dueAt, now, timezone) : null;
  // Snoozed, or planned for later than its due date: say when it's coming back.
  const plan = task.scheduledAt && task.scheduledAt !== task.dueAt && isWaiting(task, now) ? describeDue(task.scheduledAt, now, timezone) : null;
  const planLabel = plan ? (plan.tone === "today" ? `Back at ${plan.label.split(" · ")[1] ?? "later"}` : `Planned ${plan.label}`) : null;
  const doneSteps = subtasks.filter((s) => s.completed).length;
  const boss = task.isBoss ? bossStatus(subtasks) : null;
  const needsPush = shouldSuggestBreakdown({
    friction: task.friction,
    estimatedMinutes: task.estimatedMinutes,
    subtaskCount: subtasks.length,
  });

  function toggleDone(checked: boolean) {
    startTransition(async () => {
      setOptimisticDone(checked);
      if (!checked) {
        await undoCompleteTaskAction(task.id);
        return;
      }
      const outcome = await completeTaskAction(task.id);
      const undo = () => void undoCompleteTaskAction(task.id);
      if (outcome.reward || outcome.bossDefeated) celebrate(outcome, { undo });
      else notify({ title: "Marked done", detail: task.title, action: { label: "Undo", onClick: undo } });
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
        "group rounded-2xl border border-border bg-card px-4 py-3.5 transition-all duration-200 hover:-translate-y-px hover:shadow-soft",
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
            {planLabel && (
              <Badge variant="sky">
                <Moon /> {planLabel}
              </Badge>
            )}
            {task.estimatedMinutes && (
              <Badge variant="secondary">
                <Clock /> {task.estimatedMinutes} min
              </Badge>
            )}
            {task.priority === "critical" && <Badge variant="rose">Critical</Badge>}
            {task.priority === "high" && <Badge variant="peach">High priority</Badge>}
            {task.isBoss && (
              <Badge variant="rose">
                <Swords /> Boss
              </Badge>
            )}
            {task.recurrenceRule && (
              <Badge variant="outline">
                <Repeat /> {task.recurrenceRule}
              </Badge>
            )}
            {needsPush && !task.isBoss && (
              <button type="button" onClick={() => onOpen(task)} className="rounded-full">
                <Badge variant="butter" className="cursor-pointer hover:brightness-95">
                  <Zap /> Hard to start? Break it down
                </Badge>
              </button>
            )}
            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="inline-flex h-6 items-center gap-1 rounded-full bg-secondary px-2.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
              >
                {doneSteps}/{subtasks.length} steps
                <ChevronDown size={12} className={cn("transition-transform", expanded && "rotate-180")} />
              </button>
            )}
          </div>

          {boss && boss.total > 0 && (
            <div className="mt-2.5 h-1.5 w-full max-w-60 overflow-hidden rounded-full bg-muted" title={`Boss HP ${boss.hp}`}>
              <div className="h-full rounded-full bg-destructive transition-[width] duration-700" style={{ width: `${boss.hp}%` }} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {!optimisticDone && (
            <Link
              href={`/focus/${task.id}`}
              aria-label={`Start "${task.title}"`}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-all hover:bg-brand-soft hover:text-brand sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <Play size={16} />
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
