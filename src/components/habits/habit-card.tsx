"use client";

import { useId, useMemo, useOptimistic, useState, useTransition } from "react";
import { Archive, Check, Ellipsis, Pencil } from "lucide-react";
import {
  archiveHabitAction,
  clearHabitCompletionAction,
  setHabitCompletionAction,
} from "@/app/(dashboard)/habits/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { ProgressRing } from "@/components/motion/progress-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { weeklyProgress } from "@/services/habit-service";
import type { Habit, HabitCompletion, HabitCompletionStatus } from "@/types/habit";
import { habitStyle } from "./habit-color";
import { DAY_LETTERS, shortDateLabel, weekdayName } from "./habit-dates";
import { DayButton, STATUS_TEXT } from "./habit-day-button";
import { HabitDialog } from "./habit-dialog";
import { HabitHeatmap } from "./habit-heatmap";

interface CheckInUpdate {
  date: string;
  /** null clears the day. */
  status: HabitCompletionStatus | null;
}

/** Tap a day to cycle through these; the last step clears it again. */
const NEXT_STATUS: Record<HabitCompletionStatus | "none", HabitCompletionStatus | null> = {
  none: "completed",
  completed: "partial",
  partial: "skipped",
  skipped: null,
};

export function HabitCard({
  habit,
  completions,
  weekDates,
  today,
  historyDates,
  startedOn,
}: {
  habit: Habit;
  /** This habit's check-ins. May cover more than the current week (the heatmap uses the rest). */
  completions: HabitCompletion[];
  /** The current Monday-first week (YYYY-MM-DD x7), from getWeekDates on the server. */
  weekDates: string[];
  /** Today (YYYY-MM-DD) in the person's timezone, from the server. Omit and no day is singled out. */
  today?: string;
  /** 35 Monday-first dates, oldest first. Omit to hide the five-week history. */
  historyDates?: string[];
  /** The day this habit was created (YYYY-MM-DD, person's timezone). */
  startedOn?: string;
}) {
  const { celebrate, notify } = useCelebration();
  const helpId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [popDate, setPopDate] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [, startTransition] = useTransition();
  const [archiving, startArchive] = useTransition();

  // Show a tap instantly; the server's answer replaces it a moment later.
  const [shown, setShown] = useOptimistic(completions, (state: HabitCompletion[], update: CheckInUpdate) => {
    const others = state.filter((c) => c.date !== update.date);
    if (update.status === null) return others;
    return [
      ...others,
      {
        id: `pending-${update.date}`,
        habitId: habit.id,
        userId: habit.userId,
        date: update.date,
        status: update.status,
        createdAt: "",
      },
    ];
  });

  const progress = weeklyProgress(shown, weekDates);
  const count = progress.completedCount;
  const target = habit.targetCount;
  const targetMet = count >= target;

  const statusByDate = useMemo(
    () =>
      Object.fromEntries(shown.map((c) => [c.date, c.status])) as Record<string, HabitCompletionStatus | undefined>,
    [shown],
  );

  function cycle(date: string) {
    const next = NEXT_STATUS[statusByDate[date] ?? "none"];
    setPopDate(date);
    setAnnouncement(`${weekdayName(date)}: ${STATUS_TEXT[next ?? "none"]}`);

    startTransition(async () => {
      setShown({ date, status: next });
      try {
        if (next === null) {
          await clearHabitCompletionAction(habit.id, date);
          return;
        }
        const outcome = await setHabitCompletionAction(habit.id, date, next);
        if (next === "completed" || next === "partial") celebrate(outcome);
      } catch {
        notify({ title: "That didn't save", detail: "Give it another try in a moment." });
      }
    });
  }

  function archive() {
    startArchive(async () => {
      try {
        await archiveHabitAction(habit.id);
        notify({ title: "Habit archived", detail: habit.name });
      } catch {
        notify({ title: "Couldn't archive that", detail: "Give it another try in a moment." });
      }
    });
  }

  return (
    <Card
      style={habitStyle(habit.color)}
      aria-busy={archiving}
      className={cn("h-full transition-opacity duration-300", archiving && "opacity-60")}
    >
      <CardContent className="flex items-start gap-4">
        <div className="shrink-0">
          <ProgressRing
            fraction={count / target}
            size={76}
            stroke={8}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          >
            <span aria-hidden className="font-display text-2xl leading-none tabular-nums">
              {count}/{target}
            </span>
          </ProgressRing>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-display text-2xl leading-tight break-words text-balance">{habit.name}</h3>
          {habit.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{habit.description}</p>
          )}
          <p className="mt-2 text-sm text-foreground/80">
            {count} of {target} this week
          </p>
          {targetMet && (
            <p className="mt-1 flex items-start gap-1.5 text-sm font-medium">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={3} aria-hidden />
              Target hit. Anything extra is a bonus.
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="-mt-1 -mr-2" aria-label={`Actions for ${habit.name}`}>
                <Ellipsis aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={archive}>
              <Archive aria-hidden /> Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>

      <CardContent>
        <p id={helpId} className="sr-only">
          Tap a day to cycle through done, partly done and skipped. One more tap clears it.
        </p>
        <div role="group" aria-label={`${habit.name}, this week`} aria-describedby={helpId} className="grid grid-cols-7">
          {weekDates.map((date, i) => (
            <DayButton
              key={date}
              letter={DAY_LETTERS[i]}
              weekday={weekdayName(date)}
              dateLabel={shortDateLabel(date)}
              status={progress.statusByDate[date]}
              isToday={date === today}
              isFuture={today ? date > today : false}
              pop={popDate === date}
              onCycle={() => cycle(date)}
            />
          ))}
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </CardContent>

      {historyDates && historyDates.length > 0 && (
        <CardContent>
          <div className="border-t border-border/70 pt-5">
            <HabitHeatmap dates={historyDates} statusByDate={statusByDate} today={today} startedOn={startedOn} />
          </div>
        </CardContent>
      )}

      <HabitDialog open={editOpen} onOpenChange={setEditOpen} habit={habit} />
    </Card>
  );
}
