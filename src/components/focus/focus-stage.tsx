import { ArrowLeft } from "lucide-react";
import { FocusBackdrop } from "@/components/focus/focus-backdrop";
import { Button } from "@/components/ui/button";

/**
 * The chromeless canvas for Focus Mode: no sidebar, no navigation, nothing
 * else on the page. Content is centered, and scrolls instead of getting cut
 * off on short screens.
 */
export function FocusStage({ header, children }: { header?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main id="main" className="relative isolate flex min-h-dvh flex-col bg-background">
      <FocusBackdrop />
      {header}
      <div className="relative z-10 flex flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
        <div className="my-auto w-full py-6">{children}</div>
      </div>
    </main>
  );
}

/** A tiny Exit on the left and the task's name in the middle, nothing more. */
export function FocusHeader({
  title,
  onExit,
  busy = false,
}: {
  title: string;
  /** Leave out to hide Exit (for example once the task is done). */
  onExit?: () => void;
  busy?: boolean;
}) {
  return (
    <header className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
      <div className="justify-self-start">
        {onExit && (
          <Button variant="ghost" onClick={onExit} disabled={busy} className="text-muted-foreground">
            <ArrowLeft /> Exit
          </Button>
        )}
      </div>
      <p className="max-w-[46vw] min-w-0 truncate text-sm text-muted-foreground sm:max-w-md" title={title}>
        {title}
      </p>
      <div />
    </header>
  );
}
