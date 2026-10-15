import { Check, Plus } from "lucide-react";
import { EXTEND_MINUTES } from "@/components/focus/focus-logic";
import { Button } from "@/components/ui/button";

/** When a countdown ends: no alarm, no judgment, just a quiet choice. */
export function TimesUpPanel({
  busy,
  onContinue,
  onComplete,
  onExit,
}: {
  busy: boolean;
  onContinue: () => void;
  onComplete: () => void;
  onExit: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="font-display text-2xl text-balance sm:text-3xl">Time&apos;s up — keep going or call it?</p>
      <div className="flex w-full max-w-sm flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center">
        <Button variant="outline" size="lg" onClick={onContinue} disabled={busy}>
          <Plus /> Continue (+{EXTEND_MINUTES} min)
        </Button>
        <Button variant="brand" size="lg" onClick={onComplete} disabled={busy}>
          <Check /> Complete
        </Button>
        <Button variant="ghost" size="lg" onClick={onExit} disabled={busy}>
          Exit
        </Button>
      </div>
    </div>
  );
}
