"use client";

import { useEffect, useRef } from "react";
import { MailCheck } from "lucide-react";

/**
 * The calm "now check your inbox" state. Focus moves to the heading when it appears
 * so screen readers announce the change.
 */
export function CheckEmail({
  title = "Check your email.",
  children,
  footer,
}: {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="space-y-6">
      <span className="grid size-16 animate-pop place-items-center rounded-full bg-tint-mint text-foreground/80">
        <MailCheck aria-hidden className="size-7" />
      </span>
      <div className="space-y-3">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl leading-[1.05] outline-none sm:text-5xl">
          {title}
        </h1>
        <div className="space-y-2 leading-relaxed text-muted-foreground">{children}</div>
      </div>
      {footer}
    </div>
  );
}
