"use client";

import { useTransition } from "react";
import { rescheduleRestAction } from "@/app/(dashboard)/rescue/actions";
import { Button } from "@/components/ui/button";

export function MoveRestButton({ taskIds }: { taskIds: string[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending || taskIds.length === 0}
      onClick={() => startTransition(() => rescheduleRestAction(taskIds, "tomorrow"))}
    >
      Move everything else to tomorrow
    </Button>
  );
}
