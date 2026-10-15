import { cn } from "@/lib/utils";

/** The FocusFlow mark: concentric rings (focus) inside a soft square. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" opacity="0.95" />
      <circle cx="16" cy="16" r="4.4" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" opacity="0.95" />
      <circle cx="16" cy="16" r="1.4" fill="var(--primary-foreground)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[1.65rem] leading-none">FocusFlow</span>
    </span>
  );
}
