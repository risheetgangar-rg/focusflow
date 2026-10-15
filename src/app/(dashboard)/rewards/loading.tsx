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
    <div role="status" aria-label="Loading your rewards" className="mx-auto w-full max-w-5xl space-y-10">
      <div className="space-y-3">
        <Block className="h-3 w-20 rounded-full" />
        <Block className="h-11 w-64 max-w-full rounded-2xl sm:h-14" />
        <Block className="h-4 w-80 max-w-full rounded-full" />
      </div>

      <Block className="h-[26rem] rounded-[2rem] md:h-72" />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Block className="h-8 w-44 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Block className="h-44 rounded-3xl" />
            <Block className="h-44 rounded-3xl" />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Block className="h-56 rounded-[2rem]" />
          <Block className="h-72 rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}
