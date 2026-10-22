import Link from "next/link";
import { cn } from "@/lib/utils";

export { LogoMark, Wordmark } from "@/components/layout/logo-mark";
import { LogoMark, Wordmark } from "@/components/layout/logo-mark";

/** Mark + wordmark, not clickable. Use where leaving the page would be unhelpful (e.g. onboarding). */
export function Logo({ className, onLight = true }: { className?: string; onLight?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Wordmark onLight={onLight} />
    </span>
  );
}

/** Mark + wordmark that links home. */
export function LogoLink({ className, href = "/", onLight = false }: { className?: string; href?: string; onLight?: boolean }) {
  return (
    <Link
      href={href}
      aria-label="Unstuck home"
      className={cn("group inline-flex items-center gap-2.5 rounded-full outline-offset-4", className)}
    >
      <Wordmark onLight={onLight} className="transition-transform duration-300 group-hover:scale-[1.03]" />
    </Link>
  );
}
