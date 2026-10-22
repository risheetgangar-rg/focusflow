"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { pretendAwayAction } from "@/app/(dashboard)/today/welcome-actions";

/** Demo helper: you can't wait four real days in a demo, so this pretends you did. */
export function PretendAwayButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await pretendAwayAction(4);
          router.refresh();
        })
      }
      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
    >
      {pending ? "Travelling through time…" : "Demo: pretend I was away 4 days"}
    </button>
  );
}
