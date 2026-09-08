"use client";

import { useTransition } from "react";
import { rescheduleRestAction } from "@/app/(dashboard)/rescue/actions";
import { Button } from "@/components/ui/button";
import type { RescheduleTarget } from "@/services/task-service";

export function RescheduleRemaining({ taskIds }: { taskIds: string[] }) {
  const [pending, startTransition] = useTransition();
  if (taskIds.length === 0) return null;

  function move(target: RescheduleTarget) {
    startTransition(() => rescheduleRestAction(taskIds, target));
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">
        What should happen with the {taskIds.length} task{taskIds.length === 1 ? "" : "s"} left?
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => move("tomorrow")}>
          Tomorrow
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => move("this_week")}>
          This week
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => move("later_today")}>
          Later
        </Button>
      </div>
    </div>
  );
}
