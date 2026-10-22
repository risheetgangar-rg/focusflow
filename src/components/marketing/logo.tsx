import Link from "next/link";
import { cn } from "@/lib/utils";

/** A rounded square with concentric rings: the same shape as the app icon, drawn from theme tokens. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-9 shrink-0 place-items-center rounded-[22%] bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 512 512" className="size-full" fill="none" stroke="currentColor">
        <circle cx="256" cy="256" r="140" strokeWidth="30" />
        <circle cx="256" cy="256" r="72" strokeWidth="30" />
        <circle cx="256" cy="256" r="20" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl leading-none tracking-tight text-foreground", className)}>
      Unstuck
    </span>
  );
}

/** Mark + wordmark, not clickable. Use where leaving the page would be unhelpful (e.g. onboarding). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <Wordmark />
    </span>
  );
}

/** Mark + wordmark that links home. */
export function LogoLink({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Unstuck home"
      className={cn("group inline-flex items-center gap-2.5 rounded-full outline-offset-4", className)}
    >
      <LogoMark className="transition-transform duration-300 group-hover:rotate-6" />
      <Wordmark />
    </Link>
  );
}
