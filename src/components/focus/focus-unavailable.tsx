import Link from "next/link";
import { FocusStage } from "@/components/focus/focus-stage";
import { buttonVariants } from "@/components/ui/button";

/** For a task that's already finished or was taken off the list: kind, not an error. */
export function FocusUnavailable({ title, reason }: { title: string; reason: "completed" | "removed" }) {
  const done = reason === "completed";

  return (
    <FocusStage>
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <p className="text-eyebrow animate-rise">{done ? "Nothing left to do here" : "Not on your list"}</p>
        <h1 className="animate-rise font-display text-6xl leading-none sm:text-8xl">{done ? "Already done." : "All clear."}</h1>
        <p className="max-w-md text-lg text-muted-foreground [overflow-wrap:anywhere]">
          {done ? (
            <>
              <span className="line-through decoration-muted-foreground/50">{title}</span> is finished. Nice.
            </>
          ) : (
            <>
              <span className="line-through decoration-muted-foreground/50">{title}</span> isn&apos;t on your list anymore.
            </>
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/today" className={buttonVariants({ variant: "brand", size: "xl" })}>
            Back to Today
          </Link>
          <Link href="/focus" className={buttonVariants({ variant: "outline", size: "xl" })}>
            Pick something else
          </Link>
        </div>
      </div>
    </FocusStage>
  );
}
