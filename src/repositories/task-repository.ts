import type { SupabaseClient } from "@supabase/supabase-js";
import type { Subtask, Task, TaskInput } from "@/types/task";

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  importance: number;
  urgency: number;
  friction: number;
  estimated_minutes: number | null;
  due_at: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  parent_task_id: string | null;
  source: string;
  recurrence_rule: string | null;
  started_at: string | null;
  postponed_count: number;
  is_boss: boolean;
  fixed_date: boolean;
  must_do: boolean;
  task_type: string;
  felt?: string | null;
  kind?: string;
  created_at: string;
  updated_at: string;
}

interface SubtaskRow {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  position: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

const SUBTASK_CHUNK = 80;

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    importance: row.importance,
    urgency: row.urgency,
    friction: row.friction,
    estimatedMinutes: row.estimated_minutes,
    dueAt: row.due_at,
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    parentTaskId: row.parent_task_id,
    source: row.source as Task["source"],
    recurrenceRule: row.recurrence_rule as Task["recurrenceRule"],
    startedAt: row.started_at,
    postponedCount: row.postponed_count,
    isBoss: row.is_boss,
    fixedDate: row.fixed_date ?? false,
    mustDo: row.must_do ?? false,
    taskType: (row.task_type ?? "other") as Task["taskType"],
    felt: (row.felt ?? null) as Task["felt"],
    kind: (row.kind ?? "task") as Task["kind"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSubtask(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    title: row.title,
    position: row.position,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: Partial<TaskInput>) {
  return {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.importance !== undefined && { importance: input.importance }),
    ...(input.urgency !== undefined && { urgency: input.urgency }),
    ...(input.friction !== undefined && { friction: input.friction }),
    ...(input.estimatedMinutes !== undefined && { estimated_minutes: input.estimatedMinutes }),
    ...(input.dueAt !== undefined && { due_at: input.dueAt }),
    ...(input.scheduledAt !== undefined && { scheduled_at: input.scheduledAt }),
    ...(input.recurrenceRule !== undefined && { recurrence_rule: input.recurrenceRule }),
    ...(input.isBoss !== undefined && { is_boss: input.isBoss }),
    ...(input.parentTaskId !== undefined && { parent_task_id: input.parentTaskId }),
    ...(input.fixedDate !== undefined && { fixed_date: input.fixedDate }),
    ...(input.mustDo !== undefined && { must_do: input.mustDo }),
    ...(input.taskType !== undefined && { task_type: input.taskType }),
    ...(input.kind !== undefined && { kind: input.kind }),
  };
}

export async function listTasks(supabase: SupabaseClient, userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as TaskRow[]).map(toTask);
}

/**
 * Everything still open plus what was finished recently. Skips deleted tasks
 * and old completions so the dashboards stay fast as history piles up.
 */
export async function listVisibleTasks(
  supabase: SupabaseClient,
  userId: string,
  completedSince: Date,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .or(`status.eq.pending,and(status.eq.completed,completed_at.gte.${completedSince.toISOString()})`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as TaskRow[]).map(toTask);
}

export async function getTask(supabase: SupabaseClient, taskId: string): Promise<Task | null> {
  const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle();
  if (error) throw error;
  return data ? toTask(data) : null;
}

export async function createTask(
  supabase: SupabaseClient,
  userId: string,
  input: TaskInput & { source?: Task["source"] },
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: userId, source: input.source ?? "manual", ...toRow(input) })
    .select("*")
    .single();

  if (error) throw error;
  return toTask(data);
}

export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  updates: Partial<TaskInput>,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(toRow(updates))
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return toTask(data);
}

export async function deleteTask(supabase: SupabaseClient, taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

/** The next occurrence already generated for a recurring task, if any. */
export async function findRecurringChild(supabase: SupabaseClient, parentId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("parent_task_id", parentId)
    .eq("source", "recurring")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toTask(data) : null;
}

/** Undoing a completion takes back the next occurrence it generated, as long as nobody has started it. */
export async function deleteUntouchedRecurringChildren(supabase: SupabaseClient, parentId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("parent_task_id", parentId)
    .eq("source", "recurring")
    .eq("status", "pending")
    .is("started_at", null);
  if (error) throw error;
}

export async function setTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: Task["status"],
  completedAt: string | null,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status, completed_at: completedAt })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return toTask(data);
}

export async function markTaskStarted(supabase: SupabaseClient, taskId: string): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ started_at: new Date().toISOString() })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return toTask(data);
}

export async function rescheduleTask(
  supabase: SupabaseClient,
  taskId: string,
  scheduledAt: string | null,
  dueAt?: string | null,
  incrementPostponed = true,
): Promise<Task> {
  const current = incrementPostponed ? await getTask(supabase, taskId) : null;
  const { data, error } = await supabase
    .from("tasks")
    .update({
      scheduled_at: scheduledAt,
      ...(dueAt !== undefined && { due_at: dueAt }),
      ...(incrementPostponed && { postponed_count: (current?.postponedCount ?? 0) + 1 }),
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return toTask(data);
}

export async function listSubtasks(
  supabase: SupabaseClient,
  taskId: string,
): Promise<Subtask[]> {
  const { data, error } = await supabase
    .from("task_subtasks")
    .select("*")
    .eq("task_id", taskId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data as SubtaskRow[]).map(toSubtask);
}

export async function listSubtasksForTasks(
  supabase: SupabaseClient,
  taskIds: string[],
): Promise<Subtask[]> {
  if (taskIds.length === 0) return [];

  // Chunked so a long task list can't push the request URL past the server's limit.
  const chunks: string[][] = [];
  for (let i = 0; i < taskIds.length; i += SUBTASK_CHUNK) chunks.push(taskIds.slice(i, i + SUBTASK_CHUNK));

  const pages = await Promise.all(
    chunks.map(async (ids) => {
      const { data, error } = await supabase
        .from("task_subtasks")
        .select("*")
        .in("task_id", ids)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data as SubtaskRow[]).map(toSubtask);
    }),
  );
  return pages.flat();
}

export async function createSubtask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  title: string,
  position: number,
): Promise<Subtask> {
  const { data, error } = await supabase
    .from("task_subtasks")
    .insert({ user_id: userId, task_id: taskId, title, position })
    .select("*")
    .single();

  if (error) throw error;
  return toSubtask(data);
}

export async function setSubtaskCompleted(
  supabase: SupabaseClient,
  subtaskId: string,
  completed: boolean,
): Promise<Subtask> {
  const { data, error } = await supabase
    .from("task_subtasks")
    .update({ completed })
    .eq("id", subtaskId)
    .select("*")
    .single();

  if (error) throw error;
  return toSubtask(data);
}

export async function deleteSubtask(supabase: SupabaseClient, subtaskId: string): Promise<void> {
  const { error } = await supabase.from("task_subtasks").delete().eq("id", subtaskId);
  if (error) throw error;
}
