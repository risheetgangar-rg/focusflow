import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The hero calls to action. "Try the comeback" makes a guest with sample
 * tasks and drops you straight on the comeback screen: no email, no password.
 */
export function HeroActions() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        {/* No prefetch: opening /try creates a guest, so it should only happen on a real tap. */}
        <Link href="/try" prefetch={false} className={cn(buttonVariants({ size: "xl" }), "bg-sunny text-indigo hover:bg-sunny/90")}>
          Try the comeback
          <ArrowRight aria-hidden />
        </Link>
        <Link href="/signup" className={cn(buttonVariants({ variant: "outline", size: "xl" }), "border-white/40 bg-transparent text-white hover:bg-white/10")}>
          Start free
        </Link>
      </div>

      <p className="text-sm text-white/70">
        No email or password needed to try it.{" "}
        <span className="whitespace-nowrap">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-white underline underline-offset-4 transition-colors hover:text-sunny"
          >
            Log in
          </Link>
        </span>
      </p>
    </div>
  );
}
