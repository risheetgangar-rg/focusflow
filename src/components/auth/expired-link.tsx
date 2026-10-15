import Link from "next/link";
import { Hourglass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shown instead of the reset form when the emailed link was already used or has timed out. */
export function ExpiredLink() {
  return (
    <div className="space-y-6">
      <span className="grid size-16 place-items-center rounded-full bg-tint-butter text-foreground/80">
        <Hourglass aria-hidden className="size-7" />
      </span>
      <div className="space-y-3">
        <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">That link has expired.</h1>
        <p className="leading-relaxed text-muted-foreground">
          Reset links only work once, and only for a little while. Ask for a fresh one and we&apos;ll send it right over.
        </p>
      </div>
      <Link href="/forgot-password" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        Get a new link
      </Link>
    </div>
  );
}
