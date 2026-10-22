import { describe, expect, it } from "vitest";
import { gentleReason, pickAlternatives } from "@/components/focus/picker-logic";
import type { Task } from "@/types/task";

function task(id: string, over: Partial<Task> = {}): Task {
  return {
    id,
    userId: "u1",
    title: `Task ${id}`,
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
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    ...over,
  };
}

const context = { now: new Date("2026-10-07T12:00:00Z"), timezone: "UTC" };

describe("pickAlternatives", () => {
  it("puts the quickest first and leaves out the recommended task", () => {
    const tasks = [
      task("hero", { estimatedMinutes: 5 }),
      task("long", { estimatedMinutes: 45 }),
      task("quick", { estimatedMinutes: 5 }),
      task("medium", { estimatedMinutes: 15 }),
    ];
    expect(pickAlternatives(tasks, "hero", context).map((t) => t.id)).toEqual(["quick", "medium", "long"]);
  });

  it("puts tasks without an estimate after the ones that have one", () => {
    const tasks = [task("none"), task("ten", { estimatedMinutes: 10 })];
    expect(pickAlternatives(tasks, "x", context).map((t) => t.id)).toEqual(["ten", "none"]);
  });

  it("breaks ties by how much the recommendation likes them", () => {
    const tasks = [task("meh", { urgency: 1, importance: 1 }), task("pressing", { urgency: 5, importance: 5 })];
    expect(pickAlternatives(tasks, "x", context).map((t) => t.id)).toEqual(["pressing", "meh"]);
  });

  it("ignores finished tasks and caps the list", () => {
    const tasks = [
      task("done", { status: "completed", estimatedMinutes: 1 }),
      ...["a", "b", "c", "d", "e", "f"].map((id) => task(id, { estimatedMinutes: 10 })),
    ];
    const picked = pickAlternatives(tasks, "x", context);
    expect(picked).toHaveLength(4);
    expect(picked.map((t) => t.id)).not.toContain("done");
  });
});

describe("gentleReason", () => {
  it("softens the reasons that could sound like a telling-off", () => {
    expect(gentleReason("From earlier")).toBe("Ready to pick back up");
    expect(gentleReason("Keeps getting pushed back")).toBe("Been waiting a while");
  });

  it("leaves friendly reasons alone", () => {
    expect(gentleReason("Due today")).toBe("Due today");
    expect(gentleReason("Next up")).toBe("Next up");
  });
});
