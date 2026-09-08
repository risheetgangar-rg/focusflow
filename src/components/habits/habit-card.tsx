"use client";

import { useState, useTransition } from "react";
import { Circle, CircleDot, MoreHorizontal } from "lucide-react";
import {
  archiveHabitAction,
  clearHabitCompletionAction,
  setHabitCompletionAction,
} from "@/app/(dashboard)/habits/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { todayDateString, weeklyProgress, type WeeklyProgress } from "@/services/habit-service";
import { HabitForm } from "./habit-form";
import { RewardFeedback } from "@/components/gamification/reward-feedback";
import { useRewardFeedback } from "@/components/gamification/use-reward-feedback";
import type { Habit, HabitCompletion, HabitCompletionStatus } from "@/types/habit";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function DayDot({
  status,
  isToday,
  color,
  onClick,
}: {
  status: HabitCompletionStatus | undefined;
  isToday: boolean;
  color: string;
  onClick: () => void;
}) {
  const style = status === "completed" || status === "partial" ? { color } : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded p-1 ${isToday ? "bg-muted" : ""}`}
    >
      {status === "completed" || status === "partial" ? (
        <CircleDot size={18} style={style} strokeWidth={status === "partial" ? 1.5 : 2.5} />
      ) : (
        <Circle size={18} className="text-muted-foreground/40" />
      )}
    </button>
  );
}

export function HabitCard({
  habit,
  completions,
  weekDates,
}: {
  habit: Habit;
  completions: HabitCompletion[];
  weekDates: string[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();
  const { reward, show } = useRewardFeedback();
  const progress: WeeklyProgress = weeklyProgress(completions, weekDates);
  const today = todayDateString();

  function cycleStatus(date: string) {
    const current = progress.statusByDate[date];
    const next: HabitCompletionStatus | null =
      current === undefined ? "completed" : current === "completed" ? "partial" : current === "partial" ? "skipped" : null;

    startTransition(async () => {
      if (next === null) {
        await clearHabitCompletionAction(habit.id, date);
      } else {
        show(await setHabitCompletionAction(habit.id, date, next));
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ backgroundColor: habit.color }} />
          <CardTitle className="text-base">{habit.name}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Habit actions">
                <MoreHorizontal size={16} />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => startTransition(() => archiveHabitAction(habit.id))}
            >
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          {progress.completedCount} / {habit.targetCount} this week
        </p>
        <div className="flex justify-between">
          {weekDates.map((date, i) => (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground text-xs">{DAY_LABELS[i]}</span>
              <DayDot
                status={progress.statusByDate[date]}
                isToday={date === today}
                color={habit.color}
                onClick={() => cycleStatus(date)}
              />
            </div>
          ))}
        </div>
        <RewardFeedback reward={reward} />
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
          </DialogHeader>
          <HabitForm habit={habit} onSaved={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
