import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import { needsRescue, restOfBacklog, selectRecoverySet } from "@/services/rescue-service";
import { buttonVariants } from "@/components/ui/button";
import { MoveRestButton } from "@/components/rescue/move-rest-button";

export default async function RescuePage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Rescue</h1>
        <p className="text-muted-foreground">Connect Supabase to use Rescue Mode here.</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const tasks = await taskRepo.listTasks(supabase, user.id);
  const pending = tasks.filter((t) => t.status === "pending");

  if (!needsRescue(tasks, now)) {
    return (
      <div className="mx-auto max-w-md space-y-2 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Rescue</h1>
        <p className="text-muted-foreground">No rescue needed.</p>
        <Link href="/today" className="text-sm underline">
          Back to Today
        </Link>
      </div>
    );
  }

  const recoverySet = selectRecoverySet(tasks, now);
  const rest = restOfBacklog(tasks, recoverySet);
  const first = recoverySet[0];

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div className="space-y-1 text-center">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Getting back on track
        </p>
        <h1 className="text-xl">
          You have {pending.length} unfinished task{pending.length === 1 ? "" : "s"}. Let&apos;s
          focus on {recoverySet.length}:
        </h1>
      </div>

      <ol className="space-y-2">
        {recoverySet.map((task, i) => (
          <li key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
            <span className="text-muted-foreground">{i + 1}.</span>
            <span className="flex-1">{task.title}</span>
            {task.estimatedMinutes && (
              <span className="text-muted-foreground text-sm">{task.estimatedMinutes} min</span>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-col items-center gap-3">
        {first && (
          <Link href={`/focus/${first.id}`} className={buttonVariants({ size: "lg" })}>
            Start first
          </Link>
        )}
        <MoveRestButton taskIds={rest.map((t) => t.id)} />
        <p className="text-muted-foreground text-xs">You&apos;re back. One thing at a time.</p>
      </div>
    </div>
  );
}
