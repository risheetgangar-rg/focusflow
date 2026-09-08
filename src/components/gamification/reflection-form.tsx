"use client";

import { useActionState } from "react";
import { saveReflectionAction, type ReviewState } from "@/app/(dashboard)/review/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ReviewState = {};

export function ReflectionForm({ initialReflection }: { initialReflection: string | null }) {
  const [state, action, pending] = useActionState(saveReflectionAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <Textarea
        name="reflection"
        rows={3}
        defaultValue={initialReflection ?? ""}
        placeholder="Anything worth remembering about today? (optional)"
      />
      {state.message && (
        <p className="text-sm text-green-700 dark:text-green-500">{state.message}</p>
      )}
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Save reflection
      </Button>
    </form>
  );
}
