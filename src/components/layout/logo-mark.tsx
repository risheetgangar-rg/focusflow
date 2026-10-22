import { cn } from "@/lib/utils";

/** App icon: a deep indigo square with a glowing yellow "U" (from the Unstuck logo). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-9 shrink-0 place-items-center rounded-[26%] bg-indigo font-display text-lg leading-none text-sunny shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]",
        className,
      )}
    >
      <span className="[text-shadow:0_0_12px_rgb(255_224_102/0.55)]">U</span>
    </span>
  );
}

/**
 * The Unstuck wordmark: a solid, glowing "UN" and an outlined "STUCK" in yellow.
 * It's made for the indigo header; on a white background pass `onLight` and it
 * sits on its own indigo chip, like the logo artwork.
 */
export function Wordmark({ className, onLight = false }: { className?: string; onLight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline text-[1.75rem] leading-none tracking-[0.02em] text-sunny",
        onLight && "rounded-xl bg-indigo px-3 py-2",
        className,
      )}
    >
      <span className="font-display [text-shadow:0_0_14px_rgb(255_224_102/0.6)]">UN</span>
      <span className="font-outline">STUCK</span>
    </span>
  );
}
