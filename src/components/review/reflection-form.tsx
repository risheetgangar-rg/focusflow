"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { saveReflectionAction, type ReviewState } from "@/app/(dashboard)/review/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReflectionState = ReviewState & { savedText?: string };

/** One optional line about the day. No prompts, no pressure. */
export function ReflectionForm({ initialReflection }: { initialReflection: string | null }) {
  const [text, setText] = useState(initialReflection ?? "");

  const [state, action, pending] = useActionState(
    async (prev: ReflectionState, formData: FormData): Promise<ReflectionState> => {
      const result = await saveReflectionAction(prev, formData);
      return { ...result, savedText: String(formData.get("reflection") ?? "").trim() };
    },
    {},
  );

  // The "saved" note only counts while the box still matches what was saved.
  const justSaved = Boolean(state.message) && state.savedText === text.trim();

  return (
    // Keep the text after saving (React would otherwise clear the form once the action finishes).
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reflection" className="text-base font-medium text-foreground">
          Anything worth remembering about today?
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="reflection"
          name="reflection"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="A win, a worry, a thought for tomorrow. Or leave it blank."
          className="min-h-24 rounded-2xl"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save reflection"}
        </Button>
        {justSaved && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="size-4 text-brand" strokeWidth={3} aria-hidden />
            Saved. Rest well.
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
