"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { completeSideQuestAction as completeSideQuest } from "@/services/quest-service";

export async function completeSideQuestAction(questId: string) {
  const supabase = await createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await completeSideQuest(supabase, user.id, questId);
  revalidatePath("/today");
}
