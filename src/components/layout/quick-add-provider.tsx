"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, ListPlus, Mic, Repeat } from "lucide-react";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { QuickCapture } from "@/components/tasks/quick-capture";
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

  // Keyboard shortcuts: N new task, B brain dump, "/" or C quick capture. Ignored while typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector("[role=dialog]")) return;
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        openTask();
      } else if (key === "b") {
        event.preventDefault();
        router.push("/brain-dump");
      } else if (key === "/" || key === "c") {
        event.preventDefault();
        openCapture();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCapture, openTask, router]);

  const api = useMemo(() => ({ openCapture, openTask, openHabit }), [openCapture, openTask, openHabit]);

  const go = (href: string) => {
    setCaptureOpen(false);
    router.push(href);
  };

  const tiles = [
    { icon: ListPlus, tint: "bg-tint-lavender", title: "New task", hint: "Dates, notes, steps", kbd: "N", onClick: () => openTask() },
    { icon: Repeat, tint: "bg-tint-mint", title: "New habit", hint: "Something to keep up", kbd: undefined, onClick: openHabit },
    { icon: Brain, tint: "bg-tint-peach", title: "Brain dump", hint: "Several things at once", kbd: "B", onClick: () => go("/brain-dump") },
    { icon: Mic, tint: "bg-tint-sky", title: "Voice", hint: "Say it out loud", kbd: undefined, onClick: () => go("/voice") },
  ];

  return (
    <QuickAddContext.Provider value={api}>
      {children}

      <Dialog open={captureOpen} onOpenChange={setCaptureOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add something</DialogTitle>
            <DialogDescription>Get it out of your head. We&apos;ll keep it safe.</DialogDescription>
          </DialogHeader>

          <QuickCapture autoFocus onDone={() => setCaptureOpen(false)} />

          <div className="grid grid-cols-2 gap-3">
            {tiles.map(({ icon: Icon, tint, title, hint, kbd, onClick }) => (
              <button
                key={title}
                type="button"
                onClick={onClick}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-soft"
              >
                <span className={`grid size-10 place-items-center rounded-full ${tint}`}>
                  <Icon size={18} />
                </span>
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {title}
                    {kbd && (
                      <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground">
                        {kbd}
                      </kbd>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <TaskEditorDialog open={taskOpen} onOpenChange={setTaskOpen} defaultDueDate={taskDueDate} />
      <HabitDialog open={habitOpen} onOpenChange={setHabitOpen} />
    </QuickAddContext.Provider>
  );
}
