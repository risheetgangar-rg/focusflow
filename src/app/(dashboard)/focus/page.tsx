import type { Metadata } from "next";
import { PickerEmpty, PickerHero, PickerOption, type PickerItem } from "@/components/focus/focus-picker";
import { gentleReason, pickAlternatives } from "@/components/focus/picker-logic";
import { requireSession } from "@/lib/auth/session";
import { describeDue } from "@/lib/dates/format";
import { shouldSuggestBreakdown } from "@/lib/tasks/task-breaker";
import * as taskRepo from "@/repositories/task-repository";
import { recommendNext } from "@/services/recommendation-service";
import type { Task } from "@/types/task";

export const metadata: Metadata = { title: "Focus" };

/** "What should I do now?" One recommended task up top, a few quicker ones below. */
export default async function FocusPage() {
  const { supabase, userId, timezone } = await requireSession();
  const now = new Date();

  const tasks = await taskRepo.listTasks(supabase, userId);
  const recommendation = recommendNext(tasks, { now, timezone });
  const alternatives = recommendation ? pickAlternatives(tasks, recommendation.task.id, { now, timezone }) : [];

  const shown = recommendation ? [recommendation.task, ...alternatives] : [];
  const subtasks = await taskRepo.listSubtasksForTasks(
    supabase,
    shown.map((t) => t.id),
  );
  const stepCounts = new Map<string, number>();
  for (const step of subtasks) stepCounts.set(step.taskId, (stepCounts.get(step.taskId) ?? 0) + 1);

  const toItem = (task: Task): PickerItem => ({
    task,
    due: task.dueAt ? describeDue(task.dueAt, now, timezone) : null,
    stepCount: stepCounts.get(task.id) ?? 0,
  });

  const hero = recommendation ? toItem(recommendation.task) : null;
  const options = alternatives.map(toItem);
  const quickFirst = options.some((o) => o.task.estimatedMinutes);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="animate-rise mb-8 sm:mb-10">
        <p className="text-eyebrow text-muted-foreground">What should I do now?</p>
        <h1 className="mt-2 font-display text-5xl leading-none sm:text-7xl">Focus</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">One thing at a time, start to finish. Begin with this one, or grab something quick.</p>
      </header>

      {hero && recommendation ? (
        <div className="space-y-10">
          <PickerHero
            item={hero}
            reason={gentleReason(recommendation.reason)}
            tricky={shouldSuggestBreakdown({
              friction: hero.task.friction,
              estimatedMinutes: hero.task.estimatedMinutes,
              subtaskCount: hero.stepCount,
            })}
          />

          {options.length > 0 && (
            <section aria-labelledby="other-options" className="space-y-4">
              <h2 id="other-options" className="font-display text-3xl">
                {quickFirst ? "Or something quicker" : "Or start with something else"}
              </h2>
              <ul className="space-y-3">
                {options.map((item, i) => (
                  <PickerOption key={item.task.id} item={item} index={i} />
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <PickerEmpty />
      )}
    </div>
  );
}
