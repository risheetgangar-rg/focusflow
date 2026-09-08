import { createClient } from "@/lib/supabase/server";

export default async function TodayPage() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {user ? `Signed in as ${user.email}` : "Today"}
      </h1>
      <p className="text-muted-foreground">
        This is a placeholder — the real Today view (What&apos;s Next, habits, quests) lands in
        Phase 2 and beyond.
      </p>
    </div>
  );
}
