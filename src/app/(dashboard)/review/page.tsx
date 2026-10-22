import type { Metadata } from "next";
import { WrappedStory } from "@/components/wrapped/wrapped-story";
import { requireSession } from "@/lib/auth/session";
import { computeWrapped } from "@/lib/wrapped/wrapped";
import * as taskRepo from "@/repositories/task-repository";

export const metadata: Metadata = { title: "Mind Unwrapped" };

const DAY = 86_400_000;

/** Mind Unwrapped: a tap-through look back at the last seven days. Only what you did, never what you didn't. */
export default async function WrappedPage() {
  const { supabase, userId, timezone } = await requireSession();
  const now = new Date();
  const since = new Date(now.getTime() - 7 * DAY);

  const [tasks, focus, shifts] = await Promise.all([
    taskRepo.listVisibleTasks(supabase, userId, since),
    supabase
      .from("focus_sessions")
      .select("actual_minutes")
      .eq("user_id", userId)
      .gte("started_at", since.toISOString()),
    supabase
      .from("date_shifts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("undone_at", null)
      .gte("created_at", since.toISOString()),
  ]);

  const completed = tasks.filter((t) => t.status === "completed");
  const stats = computeWrapped(
    completed,
    (focus.data ?? []).map((f) => ({ actualMinutes: f.actual_minutes as number | null })),
    shifts.count ?? 0,
    timezone,
  );
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: timezone });
  const range = `${fmt.format(since)} – ${fmt.format(now)}`;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="animate-rise">
        <p className="text-eyebrow text-muted-foreground">Look back</p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">Mind Unwrapped</h1>
      </header>
      <WrappedStory stats={stats} range={range} />
    </div>
  );
}
