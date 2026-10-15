import { Skeleton } from "@/components/ui/skeleton";

/** Instant feedback while any signed-in page loads: the shell stays put and the content shimmers in. */
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-12 w-80 max-w-full rounded-2xl sm:h-16" />
      </div>
      <Skeleton className="h-56 rounded-[2rem]" />
      <div className="space-y-3">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
    </div>
  );
}
