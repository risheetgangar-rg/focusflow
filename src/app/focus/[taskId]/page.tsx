import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import * as taskRepo from "@/repositories/task-repository";
import { FocusRunner } from "@/components/focus/focus-runner";

export default async function FocusPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return <p className="p-6 text-muted-foreground">Connect Supabase to use Focus Mode.</p>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const task = await taskRepo.getTask(supabase, taskId);
  if (!task || task.userId !== user.id) notFound();

  const subtasks = await taskRepo.listSubtasks(supabase, taskId);

  return <FocusRunner task={task} subtasks={subtasks} />;
}
