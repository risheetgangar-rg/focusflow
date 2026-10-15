import { cn } from "@/lib/utils";

/**
 * A CSS-only entrance for things visible on first paint. It needs no JavaScript,
 * so the hero shows up right away instead of waiting for hydration.
 */
export function Rise({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("animate-rise", className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
