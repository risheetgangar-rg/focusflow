import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

/**
 * Scheduled jobs are allowed in two ways: Vercel's daily cron (CRON_SECRET),
 * and the Supabase scheduler, which sends a random key that only lives inside
 * the database (public.job_tokens, readable by the service role only).
 */
export async function isJobAuthorized(request: NextRequest, admin: SupabaseClient): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) return true;
  const token = request.headers.get("x-job-token");
  if (!token) return false;
  const { data } = await admin.from("job_tokens").select("token").eq("name", "notify").maybeSingle();
  return Boolean(data?.token) && data!.token === token;
}
