"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { saveHabit, type HabitFormState } from "@/app/(dashboard)/habits/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillGroup } from "@/components/ui/pill-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types/habit";
import { DEFAULT_HABIT_COLOR, HABIT_SWATCHES, inkOn, isHexColor, type HabitSwatch } from "./habit-color";

const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: n }));

function ColorSwatches({
  swatches,
  value,
  onChange,
}: {
  swatches: HabitSwatch[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm font-medium text-foreground/80">Color</legend>
      <div className="flex flex-wrap gap-3">
        {swatches.map((swatch) => {
          const selected = swatch.value.toLowerCase() === value.toLowerCase();
          return (
            <label key={swatch.value} className="relative cursor-pointer">
              <input
                type="radio"
                name="color"
                value={swatch.value}
                checked={selected}
                onChange={() => onChange(swatch.value)}
                className="peer sr-only"
              />
              <span
                style={{ backgroundColor: swatch.value, color: inkOn(swatch.value) }}
                className={cn(
                  "grid size-9 place-items-center rounded-full transition-all duration-200 hover:scale-105 peer-focus-visible:ring-4 peer-focus-visible:ring-ring/30",
                  selected && "shadow-[0_0_0_2px_var(--popover),0_0_0_4px_var(--foreground)]",
                )}
              >
                {selected && <Check className="size-4 animate-pop" strokeWidth={3} aria-hidden />}
              </span>
              <span className="sr-only">{swatch.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function HabitForm({ habit, onSaved }: { habit?: Habit; onSaved?: () => void }) {
  const { notify } = useCelebration();
  const editing = Boolean(habit);

  const initialColor = isHexColor(habit?.color) ? habit.color : DEFAULT_HABIT_COLOR;
  // A color saved before these swatches existed stays selectable.
  const swatches = HABIT_SWATCHES.some((s) => s.value.toLowerCase() === initialColor.toLowerCase())
    ? HABIT_SWATCHES
    : [{ value: initialColor, name: "Current color" }, ...HABIT_SWATCHES];

  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [color, setColor] = useState(initialColor);
  const [target, setTarget] = useState(String(habit?.targetCount ?? 3));
  const [remind, setRemind] = useState(habit?.reminderEnabled ?? false);
  const [time, setTime] = useState(habit?.reminderTime?.slice(0, 5) || "09:00");

  const [state, action, pending] = useActionState(
    async (prev: HabitFormState, formData: FormData) => {
      const result = await saveHabit(habit?.id ?? null, prev, formData);
      if (result.message) {
        notify({ title: "Habit saved", detail: String(formData.get("name") ?? "") });
        onSaved?.();
      }
      return result;
    },
    {} as HabitFormState,
  );

  return (
    // React clears a form after its action runs. Every field here is driven by state, so keep them as they are.
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="habit-name">What would you like to keep doing?</Label>
        <Input
          id="habit-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Read for ten minutes"
          required
          autoFocus={!editing}
          maxLength={120}
          className="h-14 rounded-2xl border-0 bg-muted px-5 font-display text-2xl shadow-none focus-visible:bg-card md:text-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="habit-description">
          A note <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="habit-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="What counts, or why it matters to you"
          className="min-h-16"
        />
      </div>

      <ColorSwatches swatches={swatches} value={color} onChange={setColor} />

      <div className="space-y-2.5">
        <p className="text-sm font-medium text-foreground/80">Days per week</p>
        <PillGroup
          name="targetCount"
          ariaLabel="Days per week"
          value={target}
          onValueChange={setTarget}
          options={TARGET_OPTIONS}
          optionClassName="h-10 w-10 px-0"
        />
        <p className="text-xs text-muted-foreground">Pick what feels easy. Anything extra is a bonus.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox name="reminderEnabled" checked={remind} onCheckedChange={(checked) => setRemind(checked === true)} />
          <span className="text-sm font-medium">Remind me</span>
        </label>
        {remind && (
          <div className="mt-3 flex items-center gap-3 pl-9">
            <Label htmlFor="habit-reminder-time" className="shrink-0">
              Around
            </Label>
            <Input
              id="habit-reminder-time"
              name="reminderTime"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-36"
            />
          </div>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" variant="brand" disabled={pending} className="w-full">
        {pending ? "Saving…" : editing ? "Save changes" : "Add habit"}
      </Button>
    </form>
  );
}
