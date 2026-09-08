"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeSubtaskStepAction,
  completeTaskStepAction,
  endFocusSessionAction,
  startFocusSessionAction,
} from "@/app/focus/actions";
import { addSubtaskAction } from "@/app/(dashboard)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { Subtask, Task } from "@/types/task";

interface Step {
  id: string | null;
  title: string;
}

const TIMER_OPTIONS = [
  { label: "No timer", minutes: null },
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "25 min", minutes: 25 },
];

function formatSeconds(totalSeconds: number) {
  const sign = totalSeconds < 0 ? "-" : "";
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${m}:${String(s).padStart(2, "0")}`;
}

export function FocusRunner({ task, subtasks }: { task: Task; subtasks: Subtask[] }) {
  const router = useRouter();
  const steps: Step[] =
    subtasks.length > 0
      ? subtasks.map((s) => ({ id: s.id, title: s.title }))
      : [{ id: null, title: task.title }];

  const firstIncomplete = subtasks.findIndex((s) => !s.completed);
  const [stepIndex, setStepIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);
  const [mode, setMode] = useState<"start" | "focus" | "done">("start");
  const [plannedMinutes, setPlannedMinutes] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [newStepTitle, setNewStepTitle] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (mode !== "focus" || paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, paused]);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  async function handleStart() {
    const id = await startFocusSessionAction(task.id, plannedMinutes);
    setSessionId(id);
    setElapsedSeconds(0);
    setMode("focus");
  }

  async function completeCurrentStep() {
    if (step.id) {
      await completeSubtaskStepAction(step.id);
    }
    if (isLastStep) {
      await completeTaskStepAction(task.id);
      if (sessionId) await endFocusSessionAction(sessionId, true);
      setMode("done");
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function skipStep() {
    if (isLastStep) {
      router.push("/today");
      return;
    }
    setStepIndex((i) => i + 1);
  }

  async function exitFocus() {
    if (sessionId) await endFocusSessionAction(sessionId, false);
    router.push("/today");
  }

  if (mode === "done") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <p className="text-2xl font-semibold">Nice work.</p>
        <p className="text-muted-foreground">{task.title} is complete.</p>
        <Button onClick={() => router.push("/today")}>Back to Today</Button>
      </div>
    );
  }

  if (mode === "start") {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 py-16 text-center">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">{task.title}</p>
        <p className="text-lg">
          Step {stepIndex + 1} of {steps.length}
        </p>
        <p className="text-2xl font-medium">{step.title}</p>

        {steps.length === 1 && !step.id && (
          <form
            className="flex gap-2"
            action={() => {
              if (!newStepTitle.trim()) return;
              addSubtaskAction(task.id, newStepTitle, 0);
              setNewStepTitle("");
            }}
          >
            <Input
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              placeholder="Optional: break this into a first step"
            />
            <Button type="submit" variant="outline">
              Add
            </Button>
          </form>
        )}

        {task.estimatedMinutes && (
          <p className="text-muted-foreground text-sm">~{task.estimatedMinutes} min</p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          {TIMER_OPTIONS.map((opt) => (
            <Button
              key={opt.label}
              variant={plannedMinutes === opt.minutes ? "default" : "outline"}
              size="sm"
              onClick={() => setPlannedMinutes(opt.minutes)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/today")}>
            Exit
          </Button>
          <Button variant="outline" onClick={skipStep}>
            Skip
          </Button>
          <Button onClick={handleStart}>Start</Button>
        </div>
      </div>
    );
  }

  const remaining = plannedMinutes ? plannedMinutes * 60 - elapsedSeconds : null;
  const progressPct = plannedMinutes
    ? Math.min(100, (elapsedSeconds / (plannedMinutes * 60)) * 100)
    : Math.min(100, ((stepIndex + 1) / steps.length) * 100);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <p className="text-muted-foreground text-sm tracking-wide uppercase">{task.title}</p>
      <p className="text-2xl font-medium">{step.title}</p>

      <p className="font-mono text-5xl tabular-nums">
        {remaining !== null ? formatSeconds(remaining) : formatSeconds(elapsedSeconds)}
      </p>

      <div className="w-full space-y-1">
        <Progress value={progressPct} />
        <p className="text-muted-foreground text-xs">
          Step {stepIndex + 1} of {steps.length}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="ghost" onClick={exitFocus}>
          Exit
        </Button>
        <Button variant="outline" onClick={() => setPaused((p) => !p)}>
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button variant="outline" onClick={skipStep}>
          Skip
        </Button>
        <Button onClick={completeCurrentStep}>Complete</Button>
      </div>
    </div>
  );
}
