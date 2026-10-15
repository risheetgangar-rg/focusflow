import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { MoveRestPanel } from "@/components/rescue/move-rest-panel";
import { RecoveryCard } from "@/components/rescue/recovery-card";
import { RescueClear } from "@/components/rescue/rescue-clear";
import { RescueOpenedTracker } from "@/components/rescue/rescue-opened-tracker";
import { buttonVariants } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import * as taskRepo from "@/repositories/task-repository";
import { needsRescue, restOfBacklog, selectRecoverySet } from "@/services/rescue-service";

export const metadata: Metadata = { title: "Getting back on track" };

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const asWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

function headline(pendingCount: number, focusCount: number): React.ReactNode {
  if (focusCount >= pendingCount) {
    return pendingCount === 1 ? (
      <>One task has been waiting. Let&apos;s start there.</>
    ) : (
      <>
        You have {pendingCount} unfinished tasks. Let&apos;s take them <span className="italic">one at a time</span>.
      </>
    );
  }
  return (
    <>
      You have {pendingCount} unfinished tasks. Let&apos;s focus on <span className="italic">{asWord(focusCount)}</span>.
    </>
  );
}

export default async function RescuePage() {
  const { supabase, userId, timezone, profile } = await requireSession();
  const now = new Date();
  const tasks = await taskRepo.listTasks(supabase, userId);

  if (!needsRescue(tasks, now)) {
    return <RescueClear showCompanion={profile.gamificationMode !== "off"} />;
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const recoverySet = selectRecoverySet(tasks, now);
  const rest = restOfBacklog(tasks, recoverySet);
  const first = recoverySet[0];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <RescueOpenedTracker />

      <Reveal>
        <header className="space-y-3">
          <p className="text-eyebrow">Getting back on track</p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{headline(pendingCount, recoverySet.length)}</h1>
          <p className="text-muted-foreground">Start with these. Everything else can wait.</p>
        </header>
      </Reveal>

      <ol className="space-y-3 sm:space-y-4">
        {recoverySet.map((task, index) => (
          <li key={task.id}>
            <Reveal delay={0.1 + index * 0.08}>
              <RecoveryCard task={task} index={index} now={now} timezone={timezone} />
            </Reveal>
          </li>
        ))}
      </ol>

      <Reveal delay={0.4}>
        <div className="space-y-4">
          {first && (
            <Link
              href={`/focus/${first.id}`}
              className={buttonVariants({ variant: "brand", size: "xl", className: "w-full" })}
            >
              Start first
              <ArrowRight aria-hidden />
            </Link>
          )}
          <p className="text-center text-muted-foreground">You&apos;re back. One thing at a time.</p>
        </div>
      </Reveal>

      {rest.length > 0 && (
        <Reveal delay={0.5}>
          <MoveRestPanel taskIds={rest.map((t) => t.id)} />
        </Reveal>
      )}
    </div>
  );
}
