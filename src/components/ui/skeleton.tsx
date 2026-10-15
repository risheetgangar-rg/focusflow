import { cn } from "@/lib/utils";

/** A soft shimmering placeholder, shown while a page's data is on its way. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-[shimmer_1.6s_linear_infinite] bg-[linear-gradient(110deg,var(--muted)_30%,var(--card)_50%,var(--muted)_70%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
