import { describe, expect, it } from "vitest";
import { calendarDaysBetween, pickOneWin, planMoveForward, timeLabel, welcomeBackStart } from "./rules";
import type { Task } from "@/types/task";

const now = new Date("2026-10-22T06:00:00Z"); // 11:30 in Kolkata
const tz = "Asia/Kolkata";
const day = 86_400_000;

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? Math.random().toString(36),
    userId: "u",
    title: "Task",
    description: null,
    status: "pending",
    priority: "medium",
    importance: 3,
    urgency: 3,
    friction: 3,
    estimatedMinutes: null,
    dueAt: null,
    scheduledAt: null,
    completedAt: null,
    parentTaskId: null,
    source: "manual",
    recurrenceRule: null,
    startedAt: null,
    postponedCount: 0,
    isBoss: false,
    fixedDate: false,
    mustDo: false,
    taskType: "other",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

describe("welcome back", () => {
  it("counts calendar days in the person's timezone", () => {
    expect(calendarDaysBetween(new Date(now.getTime() - 4 * day), now, tz)).toBe(4);
  });

  it("starts after 2+ days away, or with 3+ waiting tasks", () => {
    const base = { awaySince: null, welcomeDismissedOn: null, waitingCount: 0 };
    expect(welcomeBackStart({ ...base, lastSeenAt: new Date(now.getTime() - day).toISOString() }, now, tz)).toBeNull();
    const fourDaysAgo = new Date(now.getTime() - 4 * day).toISOString();
    expect(welcomeBackStart({ ...base, lastSeenAt: fourDaysAgo }, now, tz)).toBe(fourDaysAgo);
    expect(welcomeBackStart({ ...base, lastSeenAt: now.toISOString(), waitingCount: 3 }, now, tz)).not.toBeNull();
    expect(
      welcomeBackStart({ ...base, lastSeenAt: now.toISOString(), waitingCount: 3, welcomeDismissedOn: "2026-10-22" }, now, tz),
    ).toBeNull();
  });

  it("picks the smallest task as the one win, never a boss", () => {
    const tasks = [
      task({ id: "big", estimatedMinutes: 60 }),
      task({ id: "boss", estimatedMinutes: 1, isBoss: true }),
      task({ id: "tiny", estimatedMinutes: 2 }),
    ];
    expect(pickOneWin(tasks, now)?.id).toBe("tiny");
  });

  it("moves only late tasks forward by the days away, never into the past", () => {
    const late = task({ id: "late", dueAt: new Date(now.getTime() - 2 * day).toISOString() });
    const veryLate = task({ id: "very", dueAt: new Date(now.getTime() - 10 * day).toISOString() });
    const future = task({ id: "future", dueAt: new Date(now.getTime() + 3 * day).toISOString() });
    const changes = planMoveForward([late, veryLate, future], 4, now);
    expect(changes.map((c) => c.taskId)).toEqual(["late", "very"]);
    expect(changes[0].newDueAt).toBe(new Date(now.getTime() + 2 * day).toISOString());
    expect(new Date(changes[1].newDueAt!).getTime()).toBeGreaterThanOrEqual(Date.parse("2026-10-21T18:30:00Z"));
  });

  it("labels tasks Now, Soon or Whenever", () => {
    expect(timeLabel({ dueAt: null }, now, tz)).toBe("Whenever");
    expect(timeLabel({ dueAt: new Date(now.getTime() - day).toISOString() }, now, tz)).toBe("Now");
    expect(timeLabel({ dueAt: new Date(now.getTime() + 3 * day).toISOString() }, now, tz)).toBe("Soon");
    expect(timeLabel({ dueAt: new Date(now.getTime() + 20 * day).toISOString() }, now, tz)).toBe("Whenever");
  });
});
