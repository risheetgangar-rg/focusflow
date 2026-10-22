"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { trackClientEventAction } from "@/app/(dashboard)/today/actions";
import { moveForwardAction, showFullListAction, undoMoveForwardAction } from "@/app/(dashboard)/today/welcome-actions";
import { TodayCard, type CardTask } from "@/components/today/today-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Undo for "I was away", shown for a day afterwards. No counts, just the way back. */
export function UndoMoveBar({ shiftId }: { shiftId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-soft">
      <span>Your plan moved forward. Changed your mind?</span>
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
      {error && <p className="w-full text-muted-foreground">{error}</p>}
    </div>
  );
}

/**
 * The comeback screen after time away: one small win, everything else parked
 * (no numbers anywhere), and "I was away" to move the plan forward, with Undo.
 */
export function WelcomeBackMode({
  items,
  nowIso,
  daysAway,
  canMove,
  undoShiftId,
}: {
  items: CardTask[];
  nowIso: string;
  daysAway: number;
  canMove: boolean;
  undoShiftId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [movedShift, setMovedShift] = useState<string | null>(null);
  const logged = useRef(false);
  const days = Math.max(1, daysAway);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    void trackClientEventAction("rescue_opened");
  }, []);

  function move() {
    startTransition(async () => {
      const result = await moveForwardAction();
      setAsking(false);
      if (result.ok && result.shiftId) setMovedShift(result.shiftId);
    });
  }

  const shift = movedShift ?? undoShiftId;

  return (
    <div className="space-y-5">
      {shift && <UndoMoveBar shiftId={shift} />}

      <TodayCard
        items={items}
        nowIso={nowIso}
        onFinished={() => void showFullListAction("started")}
        onEnough={() => void showFullListAction("dismissed")}
        title={
          <div className="mb-2">
            <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">
              Welcome back. <em className="text-brand">Take one win.</em>
            </h1>
            <p className="mt-3 text-muted-foreground">Everything else is parked, not lost.</p>
          </div>
        }
        extraActions={
          canMove && !movedShift ? (
            <Button variant="outline" size="lg" onClick={() => setAsking(true)} disabled={pending}>
              I was away
            </Button>
          ) : null
        }
      />

      <Dialog open={asking} onOpenChange={setAsking}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              You were gone {days} {days === 1 ? "day" : "days"}. Move your plan forward by {days}{" "}
              {days === 1 ? "day" : "days"}?
            </DialogTitle>
            <DialogDescription>
              Things that slipped get new dates. Fixed dates, like appointments, stay put. You can undo this for 24 hours.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAsking(false)}>
              Not now
            </Button>
            <Button variant="brand" onClick={move} disabled={pending}>
              {pending ? "Moving…" : "Yes, move it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
