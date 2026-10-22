import { describe, expect, it } from "vitest";
import { needsRescue, restOfBacklog, selectRecoverySet } from "./rescue-service";
import type { Task } from "@/types/task";

const now = new Date("2026-09-08T12:00:00Z");

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
    fixedDate: false,
    mustDo: false,
    taskType: "other",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

const overdue = (id: string) => makeTask({ id, dueAt: "2026-09-01T12:00:00Z" });

describe("needsRescue", () => {
  it("is false with fewer than 3 overdue tasks and no repeated postponement", () => {
    const tasks = [overdue("a"), overdue("b"), makeTask({ id: "c" })];
    expect(needsRescue(tasks, now)).toBe(false);
  });

  it("is true with 3 or more overdue tasks", () => {
    const tasks = [overdue("a"), overdue("b"), overdue("c")];
    expect(needsRescue(tasks, now)).toBe(true);
  });

  it("is true when a task has been postponed repeatedly, even without 3 overdue", () => {
    const tasks = [makeTask({ id: "a", postponedCount: 3 })];
    expect(needsRescue(tasks, now)).toBe(true);
  });
});

describe("selectRecoverySet", () => {
  it("picks the quickest eligible tasks first", () => {
    const slow = { ...overdue("slow"), estimatedMinutes: null };
    const fast = { ...overdue("fast"), estimatedMinutes: 3 };
    const medium = { ...overdue("medium"), estimatedMinutes: 10 };

    const result = selectRecoverySet([slow, fast, medium], now, 2);
    expect(result.map((t) => t.id)).toEqual(["fast", "medium"]);
  });

  it("caps the set at the given limit", () => {
    const tasks = [overdue("a"), overdue("b"), overdue("c"), overdue("d")];
    expect(selectRecoverySet(tasks, now, 3)).toHaveLength(3);
  });

  it("excludes tasks that aren't overdue or postponed", () => {
    const tasks = [makeTask({ id: "fine" })];
    expect(selectRecoverySet(tasks, now)).toHaveLength(0);
  });
});

describe("restOfBacklog", () => {
  it("returns pending tasks not in the recovery set", () => {
    const a = overdue("a");
    const b = overdue("b");
    const c = makeTask({ id: "c" });
    expect(restOfBacklog([a, b, c], [a])).toEqual([b, c]);
  });
});
