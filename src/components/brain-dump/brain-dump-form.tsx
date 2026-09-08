"use client";

import { useActionState, useState } from "react";
import {
  confirmBrainDumpAction,
  parseBrainDumpAction,
  type BrainDumpParseState,
  type ConfirmState,
} from "@/app/(dashboard)/brain-dump/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ParsedTaskItem } from "@/types/brain-dump";

const parseInitial: BrainDumpParseState = {};
const confirmInitial: ConfirmState = {};

export function BrainDumpForm({
  source = "text",
  defaultText,
}: {
  source?: "text" | "voice";
  defaultText?: string;
}) {
  const [parseState, parseAction, parsing] = useActionState(parseBrainDumpAction, parseInitial);
  const [confirmState, confirmAction, confirming] = useActionState(
    confirmBrainDumpAction,
    confirmInitial,
  );
  const [items, setItems] = useState<ParsedTaskItem[] | null>(null);

  // Adjust state during render (React's recommended pattern) instead of an
  // effect, so a fresh parse/confirm result is reflected in the same commit.
  const [seenParse, setSeenParse] = useState(parseState);
  if (parseState !== seenParse) {
    setSeenParse(parseState);
    if (parseState.items) setItems(parseState.items);
  }
  const [seenConfirm, setSeenConfirm] = useState(confirmState);
  if (confirmState !== seenConfirm) {
    setSeenConfirm(confirmState);
    if (confirmState.message) setItems(null);
  }

  function updateItem(index: number, patch: Partial<ParsedTaskItem>) {
    setItems((prev) => prev?.map((it, i) => (i === index ? { ...it, ...patch } : it)) ?? null);
  }

  function removeItem(index: number) {
    setItems((prev) => prev?.filter((_, i) => i !== index) ?? null);
  }

  if (!items) {
    return (
      <form action={parseAction} className="space-y-4">
        {confirmState.message && (
          <p className="text-sm text-green-700 dark:text-green-500">{confirmState.message}</p>
        )}
        <input type="hidden" name="source" value={source} />
        <Textarea
          name="text"
          rows={5}
          defaultValue={defaultText}
          placeholder="Tomorrow call Rahul at 6 and finish presentation, and pay electricity bill Friday."
          required
        />
        {parseState.error && <p className="text-destructive text-sm">{parseState.error}</p>}
        <Button type="submit" disabled={parsing}>
          Review
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        I found {items.length} task{items.length === 1 ? "" : "s"}. Review before saving.
      </p>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              aria-label="Title"
            />
            <Input
              type="date"
              className="sm:w-36"
              value={item.dueDate ?? ""}
              onChange={(e) => updateItem(i, { dueDate: e.target.value || undefined })}
              aria-label="Due date"
            />
            <Input
              type="time"
              className="sm:w-28"
              value={item.dueTime ?? ""}
              onChange={(e) => updateItem(i, { dueTime: e.target.value || undefined })}
              aria-label="Due time"
            />
            <Select
              value={item.priority ?? "medium"}
              onValueChange={(v) => updateItem(i, { priority: v as ParsedTaskItem["priority"] })}
            >
              <SelectTrigger className="sm:w-28" aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      {confirmState.error && <p className="text-destructive text-sm">{confirmState.error}</p>}

      <form action={confirmAction} className="flex gap-2">
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <input type="hidden" name="source" value={source} />
        <Button type="submit" disabled={confirming || items.length === 0}>
          Save {items.length} task{items.length === 1 ? "" : "s"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setItems(null)}>
          Start over
        </Button>
      </form>
    </div>
  );
}
