import { cn } from "@/lib/utils";

/**
 * A circular progress ring that draws itself in (pure CSS, so it works in
 * server components and costs no JavaScript).
 */
export function ProgressRing({
  fraction,
  size = 96,
  stroke = 9,
  className,
  trackClassName,
  children,
}: {
  fraction: number;
  size?: number;
  stroke?: number;
  className?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={cn("stroke-muted", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("stroke-brand [animation:ring-fill_1.1s_cubic-bezier(0.22,1,0.36,1)_both]", className)}
          style={{ "--ring-circ": circumference } as React.CSSProperties}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  );
}
