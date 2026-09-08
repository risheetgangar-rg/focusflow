"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickAdd() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "n" || e.key === "N") router.push("/tasks");
      if (e.key === "b" || e.key === "B") router.push("/brain-dump");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="icon-sm" aria-label="Quick add">
            <Plus size={16} />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push("/tasks")}>
          Task <span className="text-muted-foreground ml-auto text-xs">N</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/habits")}>Habit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/brain-dump")}>
          Brain dump <span className="text-muted-foreground ml-auto text-xs">B</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/voice")}>Voice</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
