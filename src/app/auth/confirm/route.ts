import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for every auth email link. Supabase can hand back either a
 * PKCE `code` (default email templates) or a `token_hash` + `type` pair
 * (custom templates), so both are supported.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requested = searchParams.get("next") ?? "/today";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/today";

  const supabase = await createClient();
  if (supabase) {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) redirect(next);
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) redirect(next);
    }
  }

  redirect("/login?error=That+link+expired+or+was+already+used.+Request+a+new+one.");
}
