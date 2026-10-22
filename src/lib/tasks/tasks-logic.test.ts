import { describe, expect, it } from "vitest";
import { bossStatus } from "./boss";
import { canOfferOneMore, pickOneMore } from "./one-more";
import { MAX_STEPS, TemplateTaskBreaker, shouldSuggestBreakdown } from "./task-breaker";
import { computeUnstuckRate } from "@/lib/analytics/unstuck";
import type { Task } from "@/types/task";

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
    createdAt: "2026-09-08T00:00:00Z",
    updatedAt: "2026-09-08T00:00:00Z",
    ...overrides,
  };
}

describe("bossStatus", () => {
  it("keeps a boss with no phases yet at full health", () => {
    expect(bossStatus([])).toEqual({ total: 0, remaining: 0, hp: 100, defeated: false });
  });

  it("takes a proportional bite per completed phase", () => {
    const status = bossStatus([{ completed: true }, { completed: false }, { completed: false }, { completed: false }]);
    expect(status.hp).toBe(75);
    expect(status.defeated).toBe(false);
  });

  it("is defeated when every phase is done", () => {
    const status = bossStatus([{ completed: true }, { completed: true }]);
    expect(status.hp).toBe(0);
    expect(status.defeated).toBe(true);
  });
});

describe("TemplateTaskBreaker", () => {
  const breaker = new TemplateTaskBreaker();

  it("turns a call into concrete steps and keeps the user's own words", () => {
    const steps = breaker.suggest({ title: "Call the dentist" });
    expect(steps[0]).toContain("the dentist");
    expect(steps.length).toBeGreaterThanOrEqual(3);
  });

  it("handles a big writing project", () => {
    const steps = breaker.suggest({ title: "Finish semester presentation" });
    expect(steps[0].toLowerCase()).toContain("open");
    expect(steps.length).toBeGreaterThanOrEqual(4);
  });

  it("never exceeds the step cap and never returns empty steps", () => {
    for (const title of ["Pay rent", "Clean the kitchen", "Something odd", "Study biology"]) {
      const steps = breaker.suggest({ title });
      expect(steps.length).toBeLessThanOrEqual(MAX_STEPS);
      expect(steps.every((s) => s.trim().length > 0)).toBe(true);
    }
  });

  it("falls back to generic activation steps for unknown tasks", () => {
    const steps = breaker.suggest({ title: "Frobnicate the widget" });
    expect(steps[0]).toBe("Open what you need for this");
  });

  it("returns nothing for a blank title", () => {
    expect(breaker.suggest({ title: "   " })).toEqual([]);
  });
});

describe("shouldSuggestBreakdown", () => {
  it("nudges for hard or long tasks that have no steps", () => {
    expect(shouldSuggestBreakdown({ friction: 5, estimatedMinutes: null, subtaskCount: 0 })).toBe(true);
    expect(shouldSuggestBreakdown({ friction: 1, estimatedMinutes: 90, subtaskCount: 0 })).toBe(true);
  });

  it("stays quiet for small tasks and tasks already broken down", () => {
    expect(shouldSuggestBreakdown({ friction: 2, estimatedMinutes: 10, subtaskCount: 0 })).toBe(false);
    expect(shouldSuggestBreakdown({ friction: 5, estimatedMinutes: 90, subtaskCount: 3 })).toBe(false);
  });
});

describe("pickOneMore", () => {
  it("offers the quickest tiny task", () => {
    const tasks = [
      makeTask({ id: "a", estimatedMinutes: 5 }),
      makeTask({ id: "b", estimatedMinutes: 2 }),
      makeTask({ id: "c", estimatedMinutes: 30 }),
    ];
    expect(pickOneMore(tasks)?.taskId).toBe("b");
  });

  it("never guesses: no estimate, no offer", () => {
    expect(pickOneMore([makeTask({ estimatedMinutes: null })])).toBeNull();
  });

  it("skips the task just completed and boss tasks", () => {
    const tasks = [
      makeTask({ id: "done", estimatedMinutes: 1 }),
      makeTask({ id: "boss", estimatedMinutes: 1, isBoss: true }),
    ];
    expect(pickOneMore(tasks, { excludeTaskId: "done" })).toBeNull();
  });
});

describe("canOfferOneMore", () => {
  const now = new Date("2026-09-08T12:00:00Z").getTime();

  it("allows the first offer", () => {
    expect(canOfferOneMore({ count: 0, lastOfferedAt: null }, now)).toBe(true);
  });

  it("enforces a cooldown between offers", () => {
    expect(canOfferOneMore({ count: 1, lastOfferedAt: now - 10 * 60_000 }, now)).toBe(false);
    expect(canOfferOneMore({ count: 1, lastOfferedAt: now - 60 * 60_000 }, now)).toBe(true);
  });

  it("caps offers per day so it never becomes an endless loop", () => {
    expect(canOfferOneMore({ count: 3, lastOfferedAt: now - 5 * 3_600_000 }, now)).toBe(false);
  });
});

describe("computeUnstuckRate", () => {
  const t = (iso: string) => iso;

  it("counts a stuck session followed by action as unstuck", () => {
    const result = computeUnstuckRate([
      { name: "session_opened", createdAt: t("2026-09-08T09:00:00Z"), properties: { overdue_count: 3 } },
      { name: "task_completed", createdAt: t("2026-09-08T09:20:00Z") },
    ]);
    expect(result).toEqual({ sessions: 1, unstuck: 1, rate: 1 });
  });

  it("counts a stuck session with no follow-through as not unstuck", () => {
    const result = computeUnstuckRate([
      { name: "session_opened", createdAt: t("2026-09-08T09:00:00Z"), properties: { overdue_count: 2 } },
      { name: "task_completed", createdAt: t("2026-09-10T09:00:00Z") },
    ]);
    expect(result.unstuck).toBe(0);
    expect(result.rate).toBe(0);
  });

  it("ignores sessions with nothing overdue — they weren't stuck", () => {
    const result = computeUnstuckRate([
      { name: "session_opened", createdAt: t("2026-09-08T09:00:00Z"), properties: { overdue_count: 0 } },
    ]);
    expect(result.sessions).toBe(0);
    expect(result.rate).toBeNull();
  });
});
