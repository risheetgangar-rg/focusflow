"use client";

import { Plus } from "lucide-react";
import { useQuickAdd } from "@/components/layout/quick-add-provider";
import { Button } from "@/components/ui/button";

/** Add a task with all the details (type, Must do, fixed date, steps). */
export function AddTaskButtons() {
  const { openTask } = useQuickAdd();
  return (
    <Button variant="brand" onClick={() => openTask()}>
      <Plus /> New task
    </Button>
  );
}
