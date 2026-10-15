"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Habit } from "@/types/habit";
import { HabitForm } from "./habit-form";

/**
 * Create a habit (no `habit`) or edit one. Closes itself after a successful save.
 * Also mounted by the global quick-add menu.
 */
export function HabitDialog({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>
            {habit ? "Change anything you like. Your history stays." : "Something small you'd like to keep up. You set the pace."}
          </DialogDescription>
        </DialogHeader>

        {/* key gives each habit (and "new") a fresh form with fresh defaults */}
        <HabitForm key={habit?.id ?? "new"} habit={habit} onSaved={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
