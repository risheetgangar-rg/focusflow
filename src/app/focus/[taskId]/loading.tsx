import { FocusStage } from "@/components/focus/focus-stage";

/** Shown the instant Start is tapped, while the task loads: a quiet ring, nothing to read. */
export default function Loading() {
  return (
    <FocusStage>
      <div role="status" className="mx-auto flex flex-col items-center gap-6 text-center">
        <div aria-hidden className="size-52 animate-breathe rounded-full border-[12px] border-foreground/10" />
        <p className="text-sm text-muted-foreground">Getting ready…</p>
      </div>
    </FocusStage>
  );
}
