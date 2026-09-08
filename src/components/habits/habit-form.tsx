"use client";

import { useActionState, useEffect } from "react";
import { saveHabit, type HabitFormState } from "@/app/(dashboard)/habits/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Habit } from "@/types/habit";

const initialState: HabitFormState = {};

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];

export function HabitForm({ habit, onSaved }: { habit?: Habit; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(
    saveHabit.bind(null, habit?.id ?? null),
    initialState,
  );

  useEffect(() => {
    if (state.message) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={habit?.name} required autoFocus />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes</Label>
        <Textarea id="description" name="description" defaultValue={habit?.description ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetCount">Days per week</Label>
        <Input
          id="targetCount"
          name="targetCount"
          type="number"
          min={1}
          max={7}
          defaultValue={habit?.targetCount ?? 3}
          required
        />
      </div>

      <fieldset className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                defaultChecked={(habit?.color ?? COLORS[0]) === c}
                className="peer sr-only"
              />
              <span
                className="block size-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-foreground"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {habit ? "Save changes" : "Add habit"}
      </Button>
    </form>
  );
}
