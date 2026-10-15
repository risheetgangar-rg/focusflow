import { cn } from "@/lib/utils";

function Block({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-[linear-gradient(110deg,var(--muted)_30%,var(--card)_50%,var(--muted)_70%)] bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]",
        className,
      )}
    />
  );
}

export default function Loading() {
  return (
    <div role="status" aria-label="Loading your review" className="mx-auto w-full max-w-5xl space-y-10">
      <div className="space-y-3">
        <Block className="h-3 w-32 rounded-full" />
        <Block className="h-11 w-64 max-w-full rounded-2xl sm:h-14" />
        <Block className="h-4 w-72 max-w-full rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        <Block className="h-36 rounded-[2rem] sm:h-56" />
        <Block className="h-36 rounded-[2rem] sm:h-56" />
        <Block className="h-36 rounded-[2rem] sm:h-56" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <Block className="h-72 rounded-[2rem] lg:col-span-3" />
        <div className="space-y-6 lg:col-span-2">
          <Block className="h-44 rounded-[2rem]" />
          <Block className="h-56 rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}
