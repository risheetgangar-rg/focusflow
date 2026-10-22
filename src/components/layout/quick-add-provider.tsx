"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { AddTaskBox } from "@/components/today/add-task-box";
import { TaskEditorDialog } from "@/components/tasks/task-editor-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuickAddApi {
  /** The "+" menu: instant capture box plus the other ways to add things. */
  openCapture: () => void;
  /** The full new-task form. */
  openTask: (options?: { dueDate?: string }) => void;
  openHabit: () => void;
}

const QuickAddContext = createContext<QuickAddApi>({
  openCapture: () => {},
  openTask: () => {},
  openHabit: () => {},
});

export function useQuickAdd(): QuickAddApi {
  return useContext(QuickAddContext);
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable;
}

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskDueDate, setTaskDueDate] = useState<string | undefined>();
  const [habitOpen, setHabitOpen] = useState(false);

  const openCapture = useCallback(() => setCaptureOpen(true), []);
  const openTask = useCallback((options?: { dueDate?: string }) => {
    setTaskDueDate(options?.dueDate);
    setCaptureOpen(false);
    setTaskOpen(true);
  }, []);
  const openHabit = useCallback(() => {
    setCaptureOpen(false);
    setHabitOpen(true);
  }, []);

  // Keyboard shortcuts: N new task, "/" or C quick add. Ignored while typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector("[role=dialog]")) return;
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        openTask();
      } else if (key === "/" || key === "c") {
        event.preventDefault();
        openCapture();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCapture, openTask, router]);

  const api = useMemo(() => ({ openCapture, openTask, openHabit }), [openCapture, openTask, openHabit]);



  return (
    <QuickAddContext.Provider value={api}>
      {children}

      <Dialog open={captureOpen} onOpenChange={setCaptureOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add something</DialogTitle>
            <DialogDescription>Type it, then pick when. We&apos;ll keep it safe.</DialogDescription>
          </DialogHeader>

          <AddTaskBox />
          <button
            type="button"
            onClick={() => openTask()}
            className="text-left text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Add more details instead (type, steps, fixed date)
          </button>
        </DialogContent>
      </Dialog>

      <TaskEditorDialog open={taskOpen} onOpenChange={setTaskOpen} defaultDueDate={taskDueDate} />
      <HabitDialog open={habitOpen} onOpenChange={setHabitOpen} />
    </QuickAddContext.Provider>
  );
}
