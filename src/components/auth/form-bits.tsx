import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Big serif heading + one calm line, shared by every auth form. */
export function AuthHeading({
  title,
  subtitle,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">{title}</h1>
      {subtitle ? <p className="text-base leading-relaxed text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

/**
 * Inline feedback under a form. Errors are announced right away (role="alert");
 * success is polite. Renders nothing when there's no message.
 */
export function FormMessage({
  tone = "error",
  children,
  id,
}: {
  tone?: "error" | "success";
  children?: React.ReactNode;
  id?: string;
}) {
  if (!children) return null;
  if (tone === "error") {
    return (
      <p id={id} role="alert" className="text-sm text-destructive">
        {children}
      </p>
    );
  }
  return (
    <p id={id} role="status" className="text-sm text-foreground/80">
      {children}
    </p>
  );
}

/** A soft heads-up (for example a message that arrived in the URL). Gentle, not alarming. */
export function SoftNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-3 rounded-2xl bg-tint-butter px-4 py-3 text-sm leading-relaxed text-foreground"
    >
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground" role="separator" aria-label="or">
      <span aria-hidden className="h-px flex-1 bg-border" />
      <span aria-hidden>or</span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}

export const textLinkClass =
  "font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:text-brand hover:decoration-brand";
