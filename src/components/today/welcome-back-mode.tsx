"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Undo2 } from "lucide-react";
import { trackClientEventAction } from "@/app/(dashboard)/today/actions";
import {
  answerCleanupQuestionAction,
  moveForwardAction,
  previewMoveForwardAction,
  showFullListAction,
  undoMoveForwardAction,
} from "@/app/(dashboard)/today/welcome-actions";
import { useCelebration } from "@/components/gamification/celebration-provider";
import { useApp } from "@/components/providers/app-context";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DateChange, TimeLabel } from "@/lib/welcome-back/rules";

const ASKED_KEY = "unstuck-asked-cleanup";
const ANSWERS = [
  { value: "under_5", label: "Under 5 min" },
  { value: "5_15", label: "5–15 min" },
  { value: "15_30", label: "15–30 min" },
  { value: "over_30", label: "30+ min" },
  { value: "never_tried", label: "I'd have given up" },
];

function dayLabel(iso: string | null, tz: string): string {
  if (!iso) return "no date";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz }).format(
    new Date(iso),
  );
}

/** Undo for "I was away", shown for a day afterwards. */
export function UndoMoveBar({ shiftId, moved }: { shiftId: string; moved: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-soft">
      <span>
        Moved {moved} {moved === 1 ? "thing" : "things"} forward. Changed your mind?
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await undoMoveForwardAction(shiftId);
            if (!result.ok) setError(result.error ?? "Couldn't undo that.");
          })
        }
      >
        <Undo2 /> {pending ? "Putting back…" : "Undo"}
      </Button>
      {error && <p className="w-full text-destructive">{error}</p>}
    </div>
  );
}

/**
 * The calm screen after time away: one small thing to do, everything else
 * parked (no counts, no red), and one tap to move the late stuff forward.
 */
export function WelcomeBackMode({
  oneWin,
  daysAway,
  hasLateTasks,
  undo,
}: {
  oneWin: { id: string; title: string; minutes: number | null; label: TimeLabel; firstStep: string | null } | null;
  daysAway: number;
  hasLateTasks: boolean;
  undo: { shiftId: string; moved: number } | null;
}) {
  const router = useRouter();
  const { timezone } = useApp();
  const { notify } = useCelebration();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{ days: number; changes: DateChange[] } | null>(null);
  const [asked, setAsked] = useState(true);
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    void trackClientEventAction("rescue_opened");
    try {
      // Only ever asked once, on the first welcome back.
      if (!localStorage.getItem(ASKED_KEY)) setTimeout(() => setAsked(false), 0);
    } catch {
      // Storage blocked: skip the question.
    }
  }, []);

  function answer(value: string) {
    setAsked(true);
    try {
      localStorage.setItem(ASKED_KEY, value);
    } catch {
      // Storage blocked: the answer still gets recorded below.
    }
    void answerCleanupQuestionAction(value);
  }

  function openMove() {
    startTransition(async () => setPreview(await previewMoveForwardAction()));
  }

  function confirmMove() {
    startTransition(async () => {
      const result = await moveForwardAction();
      setPreview(null);
      if (result.ok && result.shiftId) {
        const shiftId = result.shiftId;
        notify({
          title: "Everything's moved forward",
          detail: `${result.moved} ${result.moved === 1 ? "thing" : "things"} got new dates`,
          action: { label: "Undo", onClick: () => void undoMoveForwardAction(shiftId) },
        });
      }
      await showFullListAction("moved");
    });
  }

  const awayText = daysAway >= 2 ? `You've been away ${daysAway} days. That's okay.` : "Things piled up a bit. That's okay.";

  return (
    <div className="space-y-6">
      {undo && <UndoMoveBar shiftId={undo.shiftId} moved={undo.moved} />}

      <section className="bg-grain relative overflow-hidden rounded-[2rem] bg-tint-butter p-6 sm:p-10">
        <p className="text-eyebrow text-foreground/60">{awayText}</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] sm:text-7xl">
          Welcome back. <em className="text-brand">Take 1 win.</em>
        </h1>

        {oneWin ? (
          <div className="mt-8 rounded-3xl bg-card/80 p-5 shadow-soft sm:p-6">
            <p className="text-eyebrow">One tiny thing</p>
            <p className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{oneWin.title}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="brand">{oneWin.label}</Badge>
              {oneWin.minutes ? (
                <Badge variant="secondary">
                  <Clock /> {oneWin.minutes} min
                </Badge>
              ) : null}
            </div>
            {oneWin.firstStep && (
              <p className="mt-4 text-sm text-foreground/70">
                <span className="font-medium text-foreground">First step:</span> {oneWin.firstStep}
              </p>
            )}
            <Link
              href={`/focus/${oneWin.id}`}
              onClick={() => void showFullListAction("started")}
              className={`${buttonVariants({ variant: "brand", size: "xl" })} mt-6`}
            >
              Start <ArrowRight />
            </Link>
          </div>
        ) : (
          <p className="mt-6 text-foreground/70">Nothing needs you right now. Add something whenever it comes to mind.</p>
        )}

        <p className="mt-8 text-foreground/75">Everything else is parked, not lost.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {hasLateTasks && (
            <Button variant="default" size="lg" onClick={openMove} disabled={pending}>
              {daysAway >= 1 ? "I was away" : "Give me a fresh start"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="lg"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await showFullListAction("dismissed");
              router.refresh();
            })}
          >
            Show my full list
          </Button>
        </div>
      </section>

      {!asked && (
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <p className="font-medium">Quick question (totally optional)</p>
          <p className="mt-1 text-sm text-muted-foreground">Without this, how long would sorting your list have taken you?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ANSWERS.map((a) => (
              <Button key={a.value} variant="outline" size="sm" onClick={() => answer(a.value)}>
                {a.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => answer("skipped")}>
              Skip
            </Button>
          </div>
        </section>
      )}

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Move these forward?</DialogTitle>
            <DialogDescription>
              {preview && preview.changes.length > 0
                ? `Everything that slipped while you were away moves ${preview.days} ${preview.days === 1 ? "day" : "days"} later. You can undo this for 24 hours.`
                : "Nothing is late, so there's nothing to move."}
            </DialogDescription>
          </DialogHeader>
          {preview && preview.changes.length > 0 && (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {preview.changes.map((c) => (
                <li key={c.taskId} className="rounded-2xl border border-border px-4 py-3 text-sm">
                  <p className="font-medium">{c.title}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {dayLabel(c.oldDueAt, timezone)} → <span className="text-foreground">{dayLabel(c.newDueAt, timezone)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Not now
            </Button>
            {preview && preview.changes.length > 0 && (
              <Button variant="brand" onClick={confirmMove} disabled={pending}>
                {pending ? "Moving…" : "Move them"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
