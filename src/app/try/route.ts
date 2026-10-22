import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/repositories/profile-repository";
import { seedGuestDemo } from "@/services/demo-service";

/**
 * "Try the comeback": makes a guest with six sample tasks (as if they'd been
 * away four days) and goes straight to the comeback screen. No email, no password.
 * Someone already signed in just goes to Today, with everything they had.
 */
export async function GET(request: NextRequest) {
  const home = new URL("/today", request.url);
  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/setup", request.url));

  // Already signed in (as a guest or with an account): never throw away their tasks, just go to Today.
  const { data: existing } = await supabase.auth.getClaims();
  if (existing?.claims?.sub) return NextResponse.redirect(home);

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    const back = new URL("/login", request.url);
    back.searchParams.set("error", "Trying it out isn't available right now. Please sign up instead.");
    return NextResponse.redirect(back);
  }

  try {
    await ensureProfile(supabase, data.user.id);
    await seedGuestDemo(supabase, data.user.id, "UTC", { comeback: true });
  } catch (err) {
    console.warn("sample tasks not created", err);
  }
  return NextResponse.redirect(home);
}
