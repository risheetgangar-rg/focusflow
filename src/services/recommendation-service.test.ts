import { describe, expect, it } from "vitest";
import { recommendNext, scoreTask } from "./recommendation-service";
import type { Task } from "@/types/task";

const now = new Date("2026-09-08T12:00:00Z");

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? Math.random().toString(36),
    userId: "user-1",
    title: "Untitled",
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

describe("scoreTask", () => {
  it("scores a high urgency/importance task higher than a low one", () => {
    const high = makeTask({ urgency: 5, importance: 5 });
    const low = makeTask({ urgency: 1, importance: 1 });
    expect(scoreTask(high, { now })).toBeGreaterThan(scoreTask(low, { now }));
  });

  it("scores an overdue task higher than an identical task due next week", () => {
    const overdue = makeTask({ dueAt: "2026-09-07T12:00:00Z" });
    const dueLater = makeTask({ dueAt: "2026-09-20T12:00:00Z" });
    expect(scoreTask(overdue, { now })).toBeGreaterThan(scoreTask(dueLater, { now }));
  });

  it("penalizes high friction relative to an otherwise identical low-friction task", () => {
    const easy = makeTask({ friction: 1 });
    const hard = makeTask({ friction: 5 });
    expect(scoreTask(easy, { now })).toBeGreaterThan(scoreTask(hard, { now }));
  });

  it("boosts a task that fits the time the user has available", () => {
    const fits = makeTask({ estimatedMinutes: 10 });
    const tooLong = makeTask({ estimatedMinutes: 120 });
    const context = { now, availableMinutes: 15 };
    expect(scoreTask(fits, context)).toBeGreaterThan(scoreTask(tooLong, context));
  });

  it("boosts a task the user already started", () => {
    const inProgress = makeTask({ startedAt: now.toISOString() });
    const notStarted = makeTask({});
    expect(scoreTask(inProgress, { now })).toBeGreaterThan(scoreTask(notStarted, { now }));
  });

  it("gives a small nudge to repeatedly postponed tasks, capped", () => {
    const postponedOnce = makeTask({ postponedCount: 1 });
    const postponedMany = makeTask({ postponedCount: 10 });
    const postponedCappedEquivalent = makeTask({ postponedCount: 3 });
    expect(scoreTask(postponedMany, { now })).toBe(scoreTask(postponedCappedEquivalent, { now }));
    expect(scoreTask(postponedMany, { now })).toBeGreaterThan(scoreTask(postponedOnce, { now }));
  });
});

describe("recommendNext", () => {
  it("returns null when there is nothing pending", () => {
    expect(recommendNext([], { now })).toBeNull();
    expect(recommendNext([makeTask({ status: "completed" })], { now })).toBeNull();
  });

  it("recommends the overdue task over a low-priority pending one", () => {
    const overdue = makeTask({ id: "a", dueAt: "2026-09-01T12:00:00Z", urgency: 4 });
    const trivial = makeTask({ id: "b", urgency: 1, importance: 1 });
    const result = recommendNext([trivial, overdue], { now });
    expect(result?.task.id).toBe("a");
    expect(result?.reason).toBe("Overdue");
  });

  it("prefers a task already in progress over a merely important one, all else equal", () => {
    const inProgress = makeTask({ id: "a", startedAt: now.toISOString() });
    const important = makeTask({ id: "b", importance: 4 });
    const result = recommendNext([important, inProgress], { now });
    expect(result?.task.id).toBe("a");
    expect(result?.reason).toBe("Already in progress");
  });

  it("ignores completed and cancelled tasks", () => {
    const completed = makeTask({ id: "a", status: "completed", urgency: 5, importance: 5 });
    const pending = makeTask({ id: "b", urgency: 2 });
    const result = recommendNext([completed, pending], { now });
    expect(result?.task.id).toBe("b");
  });
});
