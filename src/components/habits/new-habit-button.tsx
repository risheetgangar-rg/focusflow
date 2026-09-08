"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HabitForm } from "./habit-form";

export function NewHabitButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>New habit</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
        </DialogHeader>
        <HabitForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
