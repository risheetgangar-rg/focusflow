"use client";

import { useId } from "react";
import { AnimatePresence, m } from "motion/react";
import { MAX_TIMER_MINUTES, type TimerValue } from "@/components/focus/focus-logic";
import { Input } from "@/components/ui/input";
import { PillGroup } from "@/components/ui/pill-group";

const OPTIONS = [
  { value: "none", label: "No timer" },
  { value: "5", label: "5 min" },
  { value: "10", label: "10 min" },
  { value: "15", label: "15 min" },
  { value: "25", label: "25 min" },
  { value: "custom", label: "Custom" },
];

/** The optional timer: a few presets, or your own number. Nothing is required. */
export function TimerChoice({
  value,
  onValueChange,
  custom,
  onCustomChange,
  customInvalid,
}: {
  value: TimerValue;
  onValueChange: (value: TimerValue) => void;
  custom: string;
  onCustomChange: (text: string) => void;
  customInvalid: boolean;
}) {
  const inputId = useId();

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <PillGroup
        name="focus-timer"
        ariaLabel="Timer length"
        options={OPTIONS}
        value={value}
        onValueChange={(next) => onValueChange(next as TimerValue)}
        className="justify-center"
        optionClassName="h-11 px-5"
      />

      <AnimatePresence initial={false}>
        {value === "custom" && (
          <m.div
            key="custom"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col items-center gap-1.5 p-1.5">
              <div className="flex items-center gap-3">
                <label htmlFor={inputId} className="text-sm text-muted-foreground">
                  Minutes
                </label>
                <Input
                  id={inputId}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_TIMER_MINUTES}
                  value={custom}
                  onChange={(e) => onCustomChange(e.target.value)}
                  aria-invalid={customInvalid}
                  className="h-11 w-24 text-center"
                />
              </div>
              {customInvalid && <p className="text-xs text-muted-foreground">Pick a number from 1 to {MAX_TIMER_MINUTES}.</p>}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
