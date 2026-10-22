import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * The hero calls to action. "Try the comeback" makes a guest with sample
 * tasks and drops you straight on the comeback screen: no email, no password.
 */
export function HeroActions() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        {/* No prefetch: opening /try creates a guest, so it should only happen on a real tap. */}
        <Link href="/try" prefetch={false} className={buttonVariants({ size: "xl" })}>
          Try the comeback
          <ArrowRight aria-hidden />
        </Link>
        <Link href="/signup" className={buttonVariants({ variant: "outline", size: "xl" })}>
          Start free
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        No email or password needed to try it.{" "}
        <span className="whitespace-nowrap">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-brand"
          >
            Log in
          </Link>
        </span>
      </p>
    </div>
  );
}
