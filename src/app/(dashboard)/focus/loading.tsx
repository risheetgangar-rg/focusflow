import { cn } from "@/lib/utils";

const shimmer =
  "animate-[shimmer_1.8s_linear_infinite] bg-[linear-gradient(110deg,var(--muted)_35%,var(--accent)_50%,var(--muted)_65%)] bg-[length:200%_100%]";

export default function Loading() {
  return (
    <div role="status" aria-label="Finding your next task" className="mx-auto w-full max-w-3xl">
      <div className="mb-8 space-y-3 sm:mb-10">
        <div className={cn(shimmer, "h-3 w-44 rounded-full")} />
        <div className={cn(shimmer, "h-14 w-56 rounded-2xl sm:h-[4.5rem]")} />
        <div className={cn(shimmer, "h-4 w-full max-w-md rounded-full")} />
      </div>

      <div className="space-y-10">
        <div className={cn(shimmer, "h-72 rounded-[2rem] sm:h-80")} />
        <div className="space-y-3">
          <div className={cn(shimmer, "h-8 w-52 rounded-xl")} />
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn(shimmer, "h-20 rounded-3xl")} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
