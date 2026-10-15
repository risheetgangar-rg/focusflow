"use client";

import { ArrowRight, BellRing, Check, Repeat, Rocket, Sparkles, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillGroup } from "@/components/ui/pill-group";
import { cn } from "@/lib/utils";
import type { GamificationMode } from "@/types/user";
import { ALL_FOCUS_AREAS, FOCUS_AREAS, GAME_MODES, type FocusAreaId } from "./options";
import { StepHeading } from "./step-heading";

const AREA_ICONS: Record<FocusAreaId, LucideIcon> = {
  remembering: BellRing,
  starting: Rocket,
  focus: Target,
  habits: Repeat,
};

/** A big, tappable checkbox card. The real checkbox is visually hidden but fully keyboard accessible. */
function ChoiceCard({
  title,
  description,
  tint,
  icon: Icon,
  checked,
  onToggle,
  className,
}: {
  title: string;
  description: string;
  tint: string;
  icon: LucideIcon;
  checked: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-center gap-4 rounded-3xl border border-border bg-card p-4 pr-5 shadow-soft transition-all duration-200 select-none hover:border-foreground/25 has-checked:border-brand has-checked:bg-brand-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-ring/25 sm:p-5",
        className,
      )}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="peer sr-only" />
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl text-foreground/80", tint)}>
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{description}</span>
      </span>
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-input bg-card text-brand-foreground transition-all duration-200 peer-checked:border-brand peer-checked:bg-brand peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100"
      >
        <Check className="size-3.5 scale-50 stroke-[3] opacity-0 transition-all duration-200" />
      </span>
    </label>
  );
}

export function FocusStep({
  areas,
  onAreasChange,
  mode,
  onModeChange,
  onNext,
  onSkip,
}: {
  areas: FocusAreaId[];
  onAreasChange: (areas: FocusAreaId[]) => void;
  mode: GamificationMode;
  onModeChange: (mode: GamificationMode) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const allChosen = ALL_FOCUS_AREAS.every((id) => areas.includes(id));

  function toggle(id: FocusAreaId) {
    onAreasChange(areas.includes(id) ? areas.filter((current) => current !== id) : [...areas, id]);
  }

  // "All of these" picks everything; tapping it again (or any single card) lets go of it.
  function toggleAll() {
    onAreasChange(allChosen ? [] : [...ALL_FOCUS_AREAS]);
  }

  const modeDescription = GAME_MODES.find((option) => option.value === mode)?.description;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      className="space-y-9"
    >
      <StepHeading
        focusOnMount
        title="What do you want help with?"
        subtitle="Pick any that fit. You can change your mind later."
      />

      <fieldset className="min-w-0">
        <legend className="sr-only">What you want help with</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {FOCUS_AREAS.map((area) => (
            <ChoiceCard
              key={area.id}
              title={area.title}
              description={area.description}
              tint={area.tint}
              icon={AREA_ICONS[area.id]}
              checked={areas.includes(area.id)}
              onToggle={() => toggle(area.id)}
            />
          ))}
          <ChoiceCard
            title="All of these"
            description="A bit of everything."
            tint="bg-tint-butter"
            icon={Sparkles}
            checked={allChosen}
            onToggle={toggleAll}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      <div className="space-y-3">
        <p className="font-medium">How much game do you want?</p>
        <PillGroup
          name="gamification"
          ariaLabel="How much game do you want?"
          fill
          options={GAME_MODES.map(({ value, label }) => ({ value, label }))}
          value={mode}
          onValueChange={(value) => onModeChange(value as GamificationMode)}
        />
        <p aria-live="polite" className="min-h-10 text-sm leading-relaxed text-muted-foreground sm:min-h-5">
          {modeDescription}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="xl">
          Continue
          <ArrowRight aria-hidden />
        </Button>
        <Button type="button" variant="ghost" size="xl" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </form>
  );
}
