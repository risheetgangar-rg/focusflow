"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { brainDumpInputSchema, parsedBrainDumpSchema } from "@/lib/validation/brain-dump";
import { getTaskParser } from "@/lib/ai/task-parser";
import * as brainDumpService from "@/services/brain-dump-service";
import type { ParsedTaskItem } from "@/types/brain-dump";

export interface BrainDumpParseState {
  items?: ParsedTaskItem[];
  error?: string;
}

const NOT_CONFIGURED = "Supabase isn't connected yet — this is a local demo.";

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, userId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function parseBrainDumpAction(
  _prevState: BrainDumpParseState,
  formData: FormData,
): Promise<BrainDumpParseState> {
  const parsed = brainDumpInputSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nothing to work with yet." };
  }

  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { error: NOT_CONFIGURED };

  const items = getTaskParser().parse(parsed.data.text, new Date());
  if (items.length === 0) {
    return { error: "I couldn't confidently understand that. Try editing it." };
  }

  await brainDumpService.recordBrainDump(supabase, userId, parsed.data.text, "text", items);
  return { items };
}

export interface ConfirmState {
  error?: string;
  message?: string;
}

export async function confirmBrainDumpAction(
  _prevState: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const raw = formData.get("items");
  let items: ParsedTaskItem[];
  try {
    items = parsedBrainDumpSchema.parse({ items: JSON.parse(String(raw)) }).items;
  } catch {
    return { error: "Something went wrong reading your edits. Try again." };
  }

  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { error: NOT_CONFIGURED };

  await brainDumpService.createTasksFromItems(supabase, userId, items, "brain_dump");
  revalidatePath("/tasks");
  revalidatePath("/today");
  return { message: `Added ${items.length} task${items.length === 1 ? "" : "s"}.` };
}
