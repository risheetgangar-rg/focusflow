"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface PillOption {
  value: string;
  label: React.ReactNode;
  /** Small second line under the label (optional). */
  hint?: string;
  disabled?: boolean;
}

/**
 * A row of pill-shaped radio choices that works in plain <form>s (it submits
 * `name=value`) and can also be controlled. Fully keyboard accessible: it's
 * real radio inputs underneath.
 */
export function PillGroup({
  name,
  options,
  defaultValue,
  value,
  onValueChange,
  ariaLabel,
  className,
  optionClassName,
  fill = false,
}: {
  name: string;
  options: PillOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  optionClassName?: string;
  /** Stretch options to share the row evenly. */
  fill?: boolean;
}) {
  const groupId = useId();
  const controlled = value !== undefined;

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn("relative cursor-pointer select-none", fill && "flex-1", option.disabled && "cursor-not-allowed opacity-50")}
        >
          <input
            type="radio"
            name={name}
            id={`${groupId}-${option.value}`}
            value={option.value}
            disabled={option.disabled}
            className="peer sr-only"
            {...(controlled
              ? { checked: value === option.value, onChange: () => onValueChange?.(option.value) }
              : { defaultChecked: defaultValue === option.value, onChange: () => onValueChange?.(option.value) })}
          />
          <span
            className={cn(
              "flex h-10 flex-col items-center justify-center rounded-full border border-input bg-card px-4 text-sm font-medium text-foreground/80 transition-all duration-200 hover:border-foreground/30 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:ring-ring/25",
              option.hint && "h-auto min-h-12 py-1.5",
              optionClassName,
            )}
          >
            {option.label}
            {option.hint && <span className="text-[0.7rem] font-normal opacity-70">{option.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
