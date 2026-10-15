"use client";

import { useRef, useState } from "react";
import { ArrowRight, CalendarDays, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepHeading } from "./step-heading";
import { MAX_FIRST_TASKS, previewFirstTasks, type PreviewItem } from "./preview";

const SUGGESTIONS = ["Call the dentist tomorrow at 9", "Reply to Sam today", "Buy groceries friday"];

export function FirstTaskStep({
  busy,
  error,
  onAdd,
  onSkip,
  onDump,
}: {
  busy: boolean;
  error: string | null;
  /** Save these, then carry on to Today. */
  onAdd: (items: PreviewItem[]) => void;
  /** Carry on without adding anything. */
  onSkip: () => void;
  /** Save anything typed, then open the brain dump. */
  onDump: (items: PreviewItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  // This step only ever mounts in the browser (never on the server), so reading the clock here is safe.
  const [clock] = useState(() => ({ now: new Date(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone }));

  const { items, overflow } = previewFirstTasks(text, clock.now, clock.tz);
  const hasText = items.length > 0;

  function applySuggestion(suggestion: string) {
    setText(suggestion);
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (hasText && !busy) onAdd(items);
      }}
      className="space-y-8"
    >
      <StepHeading
        title="Create your first task"
        subtitle="Just one. Type it the way you'd say it, and we'll pick up the day and time."
      />

      <div className="space-y-3">
        <Label htmlFor="first-task" className="sr-only">
          Your first task
        </Label>
        <Input
          ref={inputRef}
          id="first-task"
          name="task"
          autoFocus
          autoComplete="off"
          maxLength={200}
          placeholder="What's on your mind?"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="h-16 rounded-2xl px-5 text-lg sm:text-xl"
        />

        <div aria-live="polite" className="min-h-28">
          {hasText ? (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="flex animate-rise flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-border/80 bg-card px-4 py-3"
                >
                  <span className="font-medium">{item.task.title}</span>
                  {item.dueLabel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                      <CalendarDays aria-hidden className="size-3.5" />
                      {item.dueLabel}
                    </span>
                  ) : null}
                  {item.priorityLabel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-peach px-2.5 py-1 text-xs font-medium text-foreground/80">
                      <Flag aria-hidden className="size-3.5" />
                      {item.priorityLabel}
                    </span>
                  ) : null}
                </li>
              ))}
              {items.length > 1 ? (
                <li className="px-1 pt-1 text-sm text-muted-foreground">That reads as {items.length} things, so we&apos;ll add them separately.</li>
              ) : null}
              {overflow > 0 ? (
                <li className="px-1 pt-1 text-sm text-muted-foreground">
                  We&apos;ll start with the first {MAX_FIRST_TASKS}. The brain dump is better for the rest.
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Not sure where to start? Try one of these.</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-9 py-1.5 whitespace-normal"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="xl" disabled={!hasText || busy}>
            {busy ? "Getting things ready…" : items.length > 1 ? "Add them and go" : "Add it and go"}
            {busy ? null : <ArrowRight aria-hidden />}
          </Button>
          <Button type="button" variant="ghost" size="xl" onClick={onSkip} disabled={busy}>
            Skip, I&apos;ll look around
          </Button>
        </div>
        <button
          type="button"
          onClick={() => onDump(items)}
          disabled={busy}
          className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {hasText ? "Add this, then dump more at once" : "Dump several things at once"}
        </button>
      </div>
    </form>
  );
}
