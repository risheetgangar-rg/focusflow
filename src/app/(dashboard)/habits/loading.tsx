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
    <div role="status" aria-label="Loading your habits" className="mx-auto w-full max-w-5xl space-y-10">
      <div className="space-y-3">
        <Block className="h-3 w-16 rounded-full" />
        <Block className="h-11 w-72 max-w-full rounded-2xl sm:h-14" />
        <Block className="h-4 w-80 max-w-full rounded-full" />
      </div>

      <Block className="h-48 rounded-[2rem]" />

      <div className="grid gap-5 md:grid-cols-2">
        <Block className="h-80 rounded-3xl" />
        <Block className="h-80 rounded-3xl" />
      </div>
    </div>
  );
}
