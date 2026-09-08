import { describe, expect, it } from "vitest";
import {
  generateHabitReminders,
  generateTaskReminders,
  isWithinQuietHours,
} from "./reminder-service";
import type { Habit } from "@/types/habit";
import type { NotificationPreferences } from "@/types/reminder";
import type { Task } from "@/types/task";

const now = new Date("2026-09-08T12:00:00");

const allOnPrefs: NotificationPreferences = {
  notifyTaskReminders: true,
  notifyHabitReminders: true,
  notifyDeadlineReminders: true,
  notifyRescueReminders: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    userId: "u1",
    title: "Task",
    description: null,
    status: "pending",
    priority: "medium",
    importance: 3,
    urgency: 3,
    friction: 1,
    estimatedMinutes: null,
    dueAt: null,
    scheduledAt: null,
    completedAt: null,
    parentTaskId: null,
    source: "manual",
    recurrenceRule: null,
    startedAt: null,
    postponedCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    userId: "u1",
    name: "Habit",
    description: null,
    color: "#000",
    targetCount: 3,
    targetPeriod: "week",
    reminderEnabled: true,
    reminderTime: "12:00",
    active: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

describe("isWithinQuietHours", () => {
  it("is false when no quiet hours are set", () => {
    expect(isWithinQuietHours(now, allOnPrefs)).toBe(false);
  });

  it("is true inside a same-day window", () => {
    const prefs = { ...allOnPrefs, quietHoursStart: "09:00", quietHoursEnd: "17:00" };
    expect(isWithinQuietHours(now, prefs)).toBe(true);
  });

  it("is false outside a same-day window", () => {
    const prefs = { ...allOnPrefs, quietHoursStart: "13:00", quietHoursEnd: "17:00" };
    expect(isWithinQuietHours(now, prefs)).toBe(false);
  });

  it("handles a window that wraps past midnight", () => {
    const prefs = { ...allOnPrefs, quietHoursStart: "22:00", quietHoursEnd: "07:00" };
    expect(isWithinQuietHours(new Date("2026-09-08T23:00:00"), prefs)).toBe(true);
    expect(isWithinQuietHours(new Date("2026-09-08T08:00:00"), prefs)).toBe(false);
  });
});

describe("generateTaskReminders", () => {
  it("nudges an upcoming task due within 15 minutes", () => {
    const task = makeTask({ dueAt: new Date(now.getTime() + 10 * 60_000).toISOString() });
    const result = generateTaskReminders([task], now, allOnPrefs);
    expect(result).toHaveLength(1);
    expect(result[0].reminderType).toBe("upcoming_task");
  });

  it("flags a deadline approaching within the hour but not the next 15 minutes", () => {
    const task = makeTask({ dueAt: new Date(now.getTime() + 45 * 60_000).toISOString() });
    const result = generateTaskReminders([task], now, allOnPrefs);
    expect(result[0].reminderType).toBe("deadline_approaching");
  });

  it("nudges a recently missed task, gently", () => {
    const task = makeTask({ dueAt: new Date(now.getTime() - 30 * 60_000).toISOString() });
    const result = generateTaskReminders([task], now, allOnPrefs);
    expect(result[0].reminderType).toBe("missed_task");
    expect(result[0].body.toLowerCase()).not.toContain("fail");
  });

  it("ignores completed tasks and tasks with no due date", () => {
    const completed = makeTask({ status: "completed", dueAt: now.toISOString() });
    const noDue = makeTask({ dueAt: null });
    expect(generateTaskReminders([completed, noDue], now, allOnPrefs)).toHaveLength(0);
  });

  it("respects disabled preferences", () => {
    const task = makeTask({ dueAt: new Date(now.getTime() + 10 * 60_000).toISOString() });
    const prefs = { ...allOnPrefs, notifyTaskReminders: false };
    expect(generateTaskReminders([task], now, prefs)).toHaveLength(0);
  });
});

describe("generateHabitReminders", () => {
  it("fires within the reminder window", () => {
    const habit = makeHabit({ reminderTime: "12:05" });
    const result = generateHabitReminders([habit], now, allOnPrefs, 15);
    expect(result).toHaveLength(1);
  });

  it("does not fire outside the window", () => {
    const habit = makeHabit({ reminderTime: "14:00" });
    expect(generateHabitReminders([habit], now, allOnPrefs, 15)).toHaveLength(0);
  });

  it("skips habits without reminders enabled", () => {
    const habit = makeHabit({ reminderEnabled: false });
    expect(generateHabitReminders([habit], now, allOnPrefs)).toHaveLength(0);
  });

  it("skips archived habits", () => {
    const habit = makeHabit({ active: false });
    expect(generateHabitReminders([habit], now, allOnPrefs)).toHaveLength(0);
  });
});
