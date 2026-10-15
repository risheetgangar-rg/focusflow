import { describe, expect, it } from "vitest";
import { computeDailyStats, computeWeeklyStats } from "./review-service";
import type { Task } from "@/types/task";

const now = new Date("2026-09-08T18:00:00Z");

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? Math.random().toString(36),
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
    isBoss: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

describe("computeDailyStats", () => {
  it("counts tasks completed today, not on other days", () => {
    const today = makeTask({ status: "completed", completedAt: "2026-09-08T10:00:00Z" });
    const yesterday = makeTask({ status: "completed", completedAt: "2026-09-07T10:00:00Z" });
    const stats = computeDailyStats([today, yesterday], now);
    expect(stats.completedCount).toBe(1);
  });

  it("counts pending tasks as remaining", () => {
    const stats = computeDailyStats([makeTask(), makeTask()], now);
    expect(stats.remainingCount).toBe(2);
  });

  it("counts pending tasks with postponements as rescheduled", () => {
    const pushed = makeTask({ postponedCount: 2 });
    const fresh = makeTask({ postponedCount: 0 });
    const stats = computeDailyStats([pushed, fresh], now);
    expect(stats.rescheduledCount).toBe(1);
  });
});

describe("computeWeeklyStats", () => {
  it("counts important tasks completed within the week window", () => {
    const inWeek = makeTask({
      status: "completed",
      importance: 5,
      completedAt: "2026-09-08T10:00:00Z",
    });
    const outOfWeek = makeTask({
      status: "completed",
      importance: 5,
      completedAt: "2026-08-01T10:00:00Z",
    });
    const notImportant = makeTask({
      status: "completed",
      importance: 2,
      completedAt: "2026-09-08T10:00:00Z",
    });

    const stats = computeWeeklyStats([inWeek, outOfWeek, notImportant], 3, "2026-09-07", "2026-09-13");
    expect(stats.importantCompletedCount).toBe(1);
    expect(stats.focusSessionCount).toBe(3);
  });
});
