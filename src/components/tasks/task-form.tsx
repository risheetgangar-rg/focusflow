"use client";

import { useActionState, useEffect } from "react";
import { saveTask, type TaskFormState } from "@/app/(dashboard)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task } from "@/types/task";

const initialState: TaskFormState = {};

function toDateInput(iso: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}
function toTimeInput(iso: string | null) {
  return iso ? new Date(iso).toISOString().slice(11, 16) : "";
}

export function TaskForm({ task, onSaved }: { task?: Task; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(
    saveTask.bind(null, task?.id ?? null),
    initialState,
  );

  useEffect(() => {
    if (state.message) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={task?.title} required autoFocus />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes</Label>
        <Textarea id="description" name="description" defaultValue={task?.description ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={toDateInput(task?.dueAt ?? null)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueTime">Due time</Label>
          <Input id="dueTime" name="dueTime" type="time" defaultValue={toTimeInput(task?.dueAt ?? null)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Scheduled date</Label>
          <Input
            id="scheduledDate"
            name="scheduledDate"
            type="date"
            defaultValue={toDateInput(task?.scheduledAt ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledTime">Scheduled time</Label>
          <Input
            id="scheduledTime"
            name="scheduledTime"
            type="time"
            defaultValue={toTimeInput(task?.scheduledAt ?? null)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={task?.priority ?? "medium"}>
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedMinutes">Estimated minutes</Label>
          <Input
            id="estimatedMinutes"
            name="estimatedMinutes"
            type="number"
            min={1}
            defaultValue={task?.estimatedMinutes ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="importance">Importance</Label>
          <Select name="importance" defaultValue={String(task?.importance ?? 3)}>
            <SelectTrigger id="importance" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="urgency">Urgency</Label>
          <Select name="urgency" defaultValue={String(task?.urgency ?? 3)}>
            <SelectTrigger id="urgency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="friction">Friction</Label>
          <Select name="friction" defaultValue={String(task?.friction ?? 1)}>
            <SelectTrigger id="friction" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurrenceRule">Repeat</Label>
        <Select name="recurrenceRule" defaultValue={task?.recurrenceRule ?? "none"}>
          <SelectTrigger id="recurrenceRule" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Doesn&apos;t repeat</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {task ? "Save changes" : "Add task"}
      </Button>
    </form>
  );
}
