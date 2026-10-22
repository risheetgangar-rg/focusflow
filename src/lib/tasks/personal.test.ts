import { describe, expect, it } from "vitest";
import { firstStepFor, guessTaskType, rankForToday, reasonFor, urgencyOf } from "./personal";
import type { Task } from "@/types/task";

const now = new Date("2026-10-23T06:00:00Z");
const hours = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();

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

describe("urgency", () => {
  it("is Now within a day, Soon within 3 days, Whenever later or undated", () => {
    expect(urgencyOf(task({ dueAt: hours(20) }), now)).toBe("now");
    expect(urgencyOf(task({ dueAt: hours(48) }), now)).toBe("soon");
    expect(urgencyOf(task({ dueAt: hours(24 * 7) }), now)).toBe("whenever");
    expect(urgencyOf(task(), now)).toBe("whenever");
  });

  it("treats a starred task as one level more urgent", () => {
    expect(urgencyOf(task({ dueAt: hours(48), mustDo: true }), now)).toBe("now");
    expect(urgencyOf(task({ mustDo: true }), now)).toBe("soon");
  });

  it("shows a passed date as Parked, never urgent", () => {
    expect(urgencyOf(task({ dueAt: hours(-5), mustDo: true }), now)).toBe("parked");
  });
});

describe("personal tasks", () => {
  it("guesses the kind of task from its words", () => {
    expect(guessTaskType("Pay the card bill")).toBe("bills");
    expect(guessTaskType("Call Rahul")).toBe("calls");
    expect(guessTaskType("Finish the slides")).toBe("work");
    expect(guessTaskType("Clean my desk")).toBe("home");
    expect(guessTaskType("Book a dentist appointment")).toBe("health");
    expect(guessTaskType("Think about life")).toBe("other");
  });

  it("gives each kind a smarter first step, unless the task has its own steps", () => {
    expect(firstStepFor(task({ taskType: "bills" }))).toBe("Open your bank or UPI app");
    expect(firstStepFor(task({ taskType: "calls", title: "Call mom" }))).toBe("Call for 5 minutes; you can end it");
    expect(firstStepFor(task({ taskType: "calls", title: "Reply to Priya" }))).toBe("Open the chat and type hi");
    expect(
      firstStepFor(task({ taskType: "work" }), [
        { id: "s", taskId: "t", userId: "u", title: "Open the doc", position: 0, completed: false, createdAt: "", updatedAt: "" },
      ]),
    ).toBe("Open the doc");
  });

  it("puts starred tasks and the kinds you care about first, then the closest deadline", () => {
    const ranked = rankForToday(
      [
        task({ id: "later", dueAt: hours(30) }),
        task({ id: "soonest", dueAt: hours(2) }),
        task({ id: "starred", mustDo: true, dueAt: hours(100) }),
        task({ id: "bill", taskType: "bills", dueAt: hours(200) }),
        task({ id: "past", dueAt: hours(-3) }),
      ],
      now,
      ["bills"],
    );
    expect(ranked.map((t) => t.id)).toEqual(["starred", "bill", "soonest", "later", "past"]);
  });

  it("with no dates, offers the smallest task first, and skips ones put off until later", () => {
    const ranked = rankForToday(
      [task({ id: "big", estimatedMinutes: 60 }), task({ id: "small", estimatedMinutes: 5 }), task({ id: "snoozed", scheduledAt: hours(20) })],
      now,
    );
    expect(ranked.map((t) => t.id)).toEqual(["small", "big"]);
  });

  it("explains why a task is first in a few words", () => {
    expect(reasonFor(task({ dueAt: hours(0.75) }), now, "UTC")).toBe("In 45 min");
    expect(reasonFor(task({ dueAt: hours(5), estimatedMinutes: 5 }), now, "UTC")).toBe("Due today · 5 min");
    expect(reasonFor(task(), now, "UTC")).toBe("No rush");
  });
});
