import type { Metadata } from "next";
import Link from "next/link";
import { Brain } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Brain dump" };

/** Brain dump is paused for now (build plan step 4): no AI is called from here. */
export default function BrainDumpPage() {
  return (
    <div className="mx-auto w-full max-w-xl pt-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Brain size={24} />
      </span>
      <h1 className="mt-5 font-display text-5xl">Brain dump</h1>
      <p className="mt-3 text-muted-foreground">Coming soon. For now, add tasks one at a time from Today.</p>
      <Link href="/today" className={`${buttonVariants({ variant: "outline", size: "lg" })} mt-6`}>
        Back to Today
      </Link>
    </div>
  );
}
