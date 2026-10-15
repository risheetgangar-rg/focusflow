"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * A password input with a show/hide toggle (fewer typos, fewer failed attempts).
 * Controlled, so the value survives a failed submit instead of being wiped by the form reset.
 */
export function PasswordField({
  label,
  value,
  onValueChange,
  autoComplete,
  hint,
  labelAside,
  minLength,
  name = "password",
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  /** Something to show opposite the label, e.g. a "Forgot password?" link. */
  labelAside?: React.ReactNode;
  minLength?: number;
  name?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {labelAside}
      </div>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-describedby={hint ? hintId : undefined}
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          {visible ? <EyeOff aria-hidden className="size-[1.1rem]" /> : <Eye aria-hidden className="size-[1.1rem]" />}
        </button>
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
