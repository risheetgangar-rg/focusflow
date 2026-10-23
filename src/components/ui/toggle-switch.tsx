"use client";

import { cn } from "@/lib/utils";

/** A big, thumb-friendly on/off switch with its label, like a phone's settings. */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  name,
  className,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
  /** When set, a hidden input sends "on" with the form. */
  name?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-10 items-center gap-2.5 rounded-full border-2 px-2 pr-4 text-sm font-semibold transition-colors",
        checked ? "border-brand bg-brand-soft text-brand" : "border-border bg-card text-foreground/80",
        className,
      )}
    >
      {name && <input type="hidden" name={name} value={checked ? "on" : ""} />}
      <span className={cn("relative h-6 w-10 rounded-full transition-colors", checked ? "bg-brand" : "bg-muted-foreground/30")}>
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] duration-150",
            checked ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}
