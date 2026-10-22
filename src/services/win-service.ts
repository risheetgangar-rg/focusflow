import type { Session } from "@/lib/auth/session";
import { describeDue } from "@/lib/dates/format";
import { MEDALS, cheerFor, progressFor, type Medal } from "@/lib/rewards/medals";
import { rankForToday } from "@/lib/tasks/personal";
import * as taskRepo from "@/repositories/task-repository";
import { completeTaskWithRewards } from "@/services/completion-service";
import { loadHistory } from "@/services/progress-service";

export interface NextUp {
  id: string;
  title: string;
  /** "Due tomorrow", "Today · 6:00 PM", or null when there's no date. */
  when: string | null;
  kind: string;
}

export interface Win {
  xpGained: number;
  xp: number;
  level: number;
  levelTitle: string;
  fraction: number;
  leveledUp: boolean;
  newMedals: Pick<Medal, "code" | "name" | "how" | "icon" | "color">[];
  cheer: string;
  next: NextUp | null;
}

/** The one thing to show next: the same choice Today makes. */
export async function nextUp(session: Session): Promise<NextUp | null> {
  const { supabase, userId, timezone, profile } = session;
  const now = new Date();
  const tasks = await taskRepo.listVisibleTasks(supabase, userId, now);
  const pending = tasks.filter((t) => t.status === "pending");
  const reminderSoon = pending
    .filter((t) => t.kind === "reminder" && t.dueAt && Date.parse(t.dueAt) - now.getTime() < 60 * 60_000)
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))[0];
  const task = reminderSoon ?? rankForToday(pending, now, profile.focusAreas)[0];
  if (!task) return null;
  const due = task.dueAt ? describeDue(task.dueAt, now, timezone) : null;
  return { id: task.id, title: task.title, when: due?.label ?? null, kind: task.kind ?? "task" };
}

/** Finishes a task and works out what it earned: XP, a level, any new medals, and what's next. */
export async function finishWithWin(session: Session, taskId: string, focusSessionId?: string | null): Promise<Win> {
  const { supabase, userId, timezone, profile } = session;
  // "Before" leaves out this task and its timer, so medals they unlock count as new.
  const history = await loadHistory(supabase, userId);
  const before = progressFor(
    { ...history, done: history.done.filter((d) => d.id !== taskId), focus: history.focus.filter((f) => f.id !== focusSessionId) },
    timezone,
  );
  await completeTaskWithRewards({ supabase, userId, timezone, mode: profile.gamificationMode }, taskId);
  const after = progressFor(await loadHistory(supabase, userId), timezone);
  const fresh = new Set(after.earned.filter((code) => !before.earned.includes(code)));

  return {
    xpGained: Math.max(0, after.xp - before.xp),
    xp: after.xp,
    level: after.level.level,
    levelTitle: after.level.title,
    fraction: after.level.fraction,
    leveledUp: after.level.level > before.level.level,
    newMedals: MEDALS.filter((m) => fresh.has(m.code)).map(({ code, name, how, icon, color }) => ({ code, name, how, icon, color })),
    cheer: cheerFor(taskId),
    next: await nextUp(session),
  };
}
