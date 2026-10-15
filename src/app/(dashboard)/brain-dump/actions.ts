"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getTaskParser } from "@/lib/ai/task-parser";
import { zonedWallClock } from "@/lib/dates/tz";
import { brainDumpInputSchema, parsedBrainDumpSchema } from "@/lib/validation/brain-dump";
import { track } from "@/services/analytics-service";
import * as brainDumpService from "@/services/brain-dump-service";
import type { ParsedTaskItem } from "@/types/brain-dump";

export interface BrainDumpParseState {
  items?: ParsedTaskItem[];
  error?: string;
}

export interface ConfirmState {
  error?: string;
  message?: string;
  count?: number;
}

const SIGN_IN_AGAIN = "Please sign in again.";

export async function parseBrainDumpAction(
  _prevState: BrainDumpParseState,
  formData: FormData,
): Promise<BrainDumpParseState> {
  const parsed = brainDumpInputSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nothing to work with yet." };
  }
  const source = formData.get("source") === "voice" ? "voice" : "text";

  const session = await getSession();
  if (!session) return { error: SIGN_IN_AGAIN };

  // "tomorrow" and "Friday" must mean the user's tomorrow and Friday, not the server's.
  const items = getTaskParser().parse(parsed.data.text, zonedWallClock(new Date(), session.timezone));
  if (items.length === 0) {
    return { error: "I couldn't confidently understand that. Try editing it." };
  }

  // The original input is always kept, even if the user never confirms the tasks.
  await brainDumpService.recordBrainDump(session.supabase, session.userId, parsed.data.text, source, items);
  await track(session.supabase, session.userId, source === "voice" ? "voice_used" : "brain_dump_used", {
    items: items.length,
  });
  return { items };
}

export async function confirmBrainDumpAction(
  _prevState: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  let items: ParsedTaskItem[];
  try {
    items = parsedBrainDumpSchema.parse({ items: JSON.parse(String(formData.get("items"))) }).items;
  } catch {
    return { error: "Something went wrong reading your edits. Try again." };
  }
  const source = formData.get("source") === "voice" ? "voice" : "brain_dump";

  const session = await getSession();
  if (!session) return { error: SIGN_IN_AGAIN };

  const count = await brainDumpService.createTasksFromItems(
    session.supabase,
    session.userId,
    items,
    source,
    session.timezone,
  );
  await Promise.all(
    items.map(() => track(session.supabase, session.userId, "task_created", { source })),
  );

  revalidatePath("/tasks");
  revalidatePath("/today");
  return { message: `Added ${count} task${count === 1 ? "" : "s"}.`, count };
}
