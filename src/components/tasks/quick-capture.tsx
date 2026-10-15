"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { CornerDownLeft, Plus } from "lucide-react";
import { createQuickTaskAction, deleteTaskAction } from "@/app/(dashboard)/tasks/actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { useApp } from "@/components/providers/app-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTaskParser } from "@/lib/ai/task-parser";
import { describeDue } from "@/lib/dates/format";
import { zonedTimeToUtc, zonedWallClock } from "@/lib/dates/tz";
import { cn } from "@/lib/utils";

/**
 * The fastest way to get something out of your head. As you type, it shows
 * exactly what will be saved (title, date, time) so nothing is a surprise.
 */
export function QuickCapture({
  autoFocus = false,
  onDone,
  className,
}: {
  autoFocus?: boolean;
  onDone?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const { timezone } = useApp();
  const { notify } = useCelebration();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // A stable reference "now" for labels; fresh enough for something typed in a few seconds.
  const [now] = useState(() => new Date());

  const items = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return [];
    return getTaskParser().parse(trimmed, zonedWallClock(now, timezone));
  }, [text, timezone, now]);

  const single = items.length === 1 ? items[0] : null;
  const many = items.length > 1;

  const dueLabel = useMemo(() => {
    if (!single?.dueDate) return null;
    const when = zonedTimeToUtc(single.dueDate, single.dueTime, timezone);
    return describeDue(when.toISOString(), now, timezone).label;
  }, [single, timezone, now]);

  function finish() {
    setText("");
    setError(null);
    onDone?.();
  }

  function addOne(asTyped: boolean) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const payload = asTyped || !single ? { title: trimmed } : single;

    startTransition(async () => {
      const result = await createQuickTaskAction({
        title: payload.title,
        dueDate: "dueDate" in payload ? payload.dueDate : undefined,
        dueTime: "dueTime" in payload ? payload.dueTime : undefined,
        priority: "priority" in payload ? payload.priority : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      notify({
        title: "Added to your list",
        detail: payload.title,
        action: { label: "Undo", onClick: () => void deleteTaskAction(result.taskId) },
      });
      finish();
    });
  }

  function reviewAll() {
    const typed = text.trim();
    finish();
    router.push(`/brain-dump?text=${encodeURIComponent(typed)}`);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (many) reviewAll();
          else addOne(false);
        }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-1.5 shadow-soft transition-all focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15"
      >
        <Plus size={20} className="shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus={autoFocus}
          maxLength={400}
          aria-label="Quick capture"
          placeholder="What's on your mind? Try “call Rahul tomorrow at 6”"
          className="h-12 min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-muted-foreground/80"
        />
        <Button type="submit" size="sm" variant={text.trim() ? "default" : "ghost"} disabled={pending || !text.trim()}>
          {pending ? "Adding…" : many ? "Review" : "Add"}
          <CornerDownLeft className="hidden sm:block" />
        </Button>
      </form>

      <AnimatePresence initial={false}>
        {text.trim() && (
          <m.div
            key="preview"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 px-1 text-sm">
              {single && (
                <>
                  <span className="text-muted-foreground">Will add</span>
                  <span className="font-medium">{single.title}</span>
                  {dueLabel && <Badge variant="brand">{dueLabel}</Badge>}
                  {single.priority && <Badge variant="peach">{single.priority}</Badge>}
                </>
              )}
              {many && (
                <>
                  <span className="text-muted-foreground">
                    Looks like <strong className="text-foreground">{items.length} tasks</strong>. Review them first?
                  </span>
                  <button
                    type="button"
                    onClick={() => addOne(true)}
                    className="font-medium underline underline-offset-4 hover:text-brand"
                  >
                    Add as one task
                  </button>
                </>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="px-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
