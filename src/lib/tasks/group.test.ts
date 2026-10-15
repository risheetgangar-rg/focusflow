import { describe, expect, it } from "vitest";
import { bucketTask, groupSubtasks, groupTasks } from "./group";
import type { Subtask, Task } from "@/types/task";

const tz = "Asia/Kolkata";
const now = new Date("2026-09-08T08:30:00Z"); // Tue 8 Sep, 14:00 IST

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? Math.random().toString(36),
    userId: "u",
    title: "T",
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
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

describe("bucketTask", () => {
  it("puts date-less tasks in someday", () => {
    expect(bucketTask(makeTask(), now, tz)).toBe("someday");
  });

  it("buckets by the user's calendar day, not UTC's", () => {
    // 20:00 UTC on the 8th is already the 9th in Kolkata -> upcoming, not today.
    expect(bucketTask(makeTask({ dueAt: "2026-09-08T20:00:00Z" }), now, tz)).toBe("upcoming");
    expect(bucketTask(makeTask({ dueAt: "2026-09-08T12:00:00Z" }), now, tz)).toBe("today");
    expect(bucketTask(makeTask({ dueAt: "2026-09-07T12:00:00Z" }), now, tz)).toBe("earlier");
  });

  it("files completed tasks under done", () => {
    expect(bucketTask(makeTask({ status: "completed", dueAt: "2026-09-01T00:00:00Z" }), now, tz)).toBe("done");
  });
});

describe("groupTasks", () => {
  it("hides cancelled (soft-deleted) tasks and sorts each bucket", () => {
    const a = makeTask({ id: "a", dueAt: "2026-09-12T00:00:00Z" });
    const b = makeTask({ id: "b", dueAt: "2026-09-10T00:00:00Z" });
    const gone = makeTask({ id: "gone", status: "cancelled" });
    const grouped = groupTasks([a, b, gone], now, tz);
    expect(grouped.upcoming.map((t) => t.id)).toEqual(["b", "a"]);
    expect(Object.values(grouped).flat().some((t) => t.id === "gone")).toBe(false);
  });
});

describe("groupSubtasks", () => {
  it("groups by task and keeps steps in order", () => {
    const step = (id: string, taskId: string, position: number) =>
      ({ id, taskId, position, title: id, completed: false, userId: "u", createdAt: "", updatedAt: "" }) as Subtask;
    const grouped = groupSubtasks([step("s2", "t1", 1), step("s1", "t1", 0), step("x", "t2", 0)]);
    expect(grouped.t1.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(grouped.t2).toHaveLength(1);
  });
});
