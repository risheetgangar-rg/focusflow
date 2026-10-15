"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HabitDialog } from "./habit-dialog";

/** A button that opens the new-habit dialog. */
export function NewHabitButton({
  label = "New habit",
  variant = "default",
  size = "lg",
  className,
}: {
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {label}
      </Button>
      <HabitDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
