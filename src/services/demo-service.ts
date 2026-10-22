import type { SupabaseClient } from "@supabase/supabase-js";
import { updateProfile } from "@/repositories/profile-repository";
import * as taskRepo from "@/repositories/task-repository";
import type { TaskInput } from "@/types/task";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Every sample starts its notes with this, so the app can label it "Sample". */
export const SAMPLE_NOTE = "Sample task — delete it whenever you like.";

/**
 * A guest starts with six sample tasks, as if they'd been away for four days:
 * a few things slipped, one appointment has a fixed date, one is starred.
 * That's exactly the moment Unstuck is built for.
 */
export async function seedGuestDemo(
  supabase: SupabaseClient,
  userId: string,
  _timezone = "UTC",
  options: { comeback?: boolean } = {},
): Promise<void> {
  const now = Date.now();
  const at = (offset: number) => new Date(now + offset).toISOString();
  const sample = (task: TaskInput) => ({ ...task, description: SAMPLE_NOTE });

  const tasks: TaskInput[] = [
    { title: "Pay the card bill", taskType: "bills", estimatedMinutes: 2, mustDo: true, dueAt: at(-2 * DAY) },
    { title: "Reply to Priya's email", taskType: "calls", estimatedMinutes: 5, dueAt: at(-3 * DAY) },
    { title: "Call the landlord about the tap", taskType: "calls", estimatedMinutes: 10, dueAt: at(-DAY) },
    { title: "Finish the presentation slides", taskType: "work", estimatedMinutes: 45, dueAt: at(DAY) },
    { title: "Dentist appointment", taskType: "health", fixedDate: true, dueAt: at(2 * DAY + 5 * HOUR) },
    { title: "Clean my desk", taskType: "home", estimatedMinutes: 15, dueAt: null },
  ];
  for (const task of tasks) await taskRepo.createTask(supabase, userId, sample(task));

  const away = new Date(now - 4 * DAY).toISOString();
  await updateProfile(supabase, userId, {
    onboardingCompleted: true,
    focusAreas: ["bills"],
    ...(options.comeback ? { lastSeenAt: away, awaySince: away } : { lastSeenAt: new Date(now).toISOString() }),
  });
}
