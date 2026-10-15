"use client";

import Link from "next/link";
import { Brain, Plus } from "lucide-react";
import { useQuickAdd } from "@/components/layout/quick-add-provider";
import { Button, buttonVariants } from "@/components/ui/button";

/** The two ways to add several-or-one: a proper task form, or dump it all out of your head. */
export function AddTaskButtons() {
  const { openTask } = useQuickAdd();
  return (
    <div className="flex items-center gap-2">
      <Link href="/brain-dump" className={buttonVariants({ variant: "outline" })}>
        <Brain /> Brain dump
      </Link>
      <Button variant="brand" onClick={() => openTask()}>
        <Plus /> New task
      </Button>
    </div>
  );
}
