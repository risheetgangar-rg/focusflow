import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FocusRunner } from "@/components/focus/focus-runner";
import { requireSession } from "@/lib/auth/session";
import * as taskRepo from "@/repositories/task-repository";

export const metadata: Metadata = { title: "Focus" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Focus Mode lives outside the app shell on purpose: no sidebar, no nav, no
 * backlog. A finished (or removed) task is handled inside the runner, not here,
 * because finishing a task re-renders this page and the celebration must survive that.
 */
export default async function FocusPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  // Anything that isn't an id can never match a task (and would only make the database complain).
  if (!UUID.test(taskId)) notFound();

  const { supabase, userId } = await requireSession();
  const task = await taskRepo.getTask(supabase, taskId);
  if (!task || task.userId !== userId) notFound();

  const subtasks = await taskRepo.listSubtasks(supabase, taskId);
  return <FocusRunner task={task} subtasks={subtasks} />;
}
