"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile as updateProfileRow } from "@/repositories/profile-repository";
import { updateProfileSchema } from "@/lib/validation/auth";
import type { AuthFormState } from "../(auth)/actions";

export async function updateProfile(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  await updateProfileRow(supabase, user.id, parsed.data);
  return { message: "Saved." };
}
