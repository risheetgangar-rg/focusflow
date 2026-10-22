import type { SupabaseClient } from "@supabase/supabase-js";
import { getWeekDatesInTz } from "@/lib/dates/tz";
import * as habitRepo from "@/repositories/habit-repository";
import { updateProfile } from "@/repositories/profile-repository";
import * as taskRepo from "@/repositories/task-repository";
import { createNotes } from "@/repositories/welcome-repository";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * A guest's account starts with a small, realistic list so anyone can see how
 * Unstuck works in a minute: a couple of late things, a big task broken into
 * steps, a habit and a note. Nothing here is real; it's theirs to play with.
 */
export async function seedGuestDemo(supabase: SupabaseClient, userId: string, timezone = "UTC"): Promise<void> {
  const now = Date.now();
  const at = (offset: number) => new Date(now + offset).toISOString();

  const tasks = [
    { title: "Pay the card bill", estimatedMinutes: 2, importance: 4, urgency: 4, friction: 1, dueAt: at(-DAY) },
    { title: "Reply to Priya's email", estimatedMinutes: 5, importance: 3, urgency: 3, friction: 2, dueAt: at(-2 * DAY) },
    { title: "Call Rahul about the weekend", estimatedMinutes: 10, importance: 3, urgency: 3, friction: 2, dueAt: at(4 * HOUR) },
    { title: "Book a dentist appointment", estimatedMinutes: 10, importance: 3, urgency: 2, friction: 3, dueAt: at(3 * DAY) },
    { title: "Clean my desk", estimatedMinutes: 15, importance: 2, urgency: 1, friction: 2, dueAt: null },
  ];
  for (const t of tasks) {
    await taskRepo.createTask(supabase, userId, { ...t, priority: t.importance >= 4 ? "high" : "medium" });
  }

  const slides = await taskRepo.createTask(supabase, userId, {
    title: "Finish the presentation slides",
    estimatedMinutes: 45,
    importance: 4,
    urgency: 3,
    friction: 4,
    priority: "high",
    dueAt: at(DAY),
  });
  const steps = ["Open the slides file", "Write the three main points", "Add one picture per slide"];
  for (const [i, step] of steps.entries()) await taskRepo.createSubtask(supabase, userId, slides.id, step, i);

  const water = await habitRepo.createHabit(supabase, userId, {
    name: "Drink a glass of water",
    description: null,
    color: "#5b4bf0",
    targetCount: 5,
    reminderEnabled: false,
    reminderTime: null,
  });
  // Two check-ins earlier this week, so the week view isn't empty.
  const week = getWeekDatesInTz(new Date(), timezone).filter((d) => d < new Date(now).toISOString().slice(0, 10));
  for (const date of week.slice(-2)) await habitRepo.setCompletion(supabase, userId, water.id, date, "completed");

  await createNotes(supabase, userId, ["Idea: a yellow theme for the app"]);
  await updateProfile(supabase, userId, {
    onboardingCompleted: true,
    gamificationMode: "light",
    lastSeenAt: new Date(now).toISOString(),
  });
}
