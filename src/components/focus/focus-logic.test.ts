import { describe, expect, it } from "vitest";
import {
  focusEyebrow,
  formatClock,
  headlineSize,
  mergeOutcomes,
  mergeRewards,
  parseCustomMinutes,
  planFocus,
  resolveTimer,
  spokenClock,
} from "@/components/focus/focus-logic";
import type { CompletionOutcome, RewardResult } from "@/types/gamification";
import type { Subtask } from "@/types/task";

function step(id: string, completed = false): Subtask {
  return {
    id,
    taskId: "t1",
    userId: "u1",
    title: `Step ${id}`,
    position: Number(id),
    completed,
    createdAt: "2026-10-07T00:00:00Z",
    updatedAt: "2026-10-07T00:00:00Z",
  };
}

const reward = (over: Partial<RewardResult> = {}): RewardResult => ({
  xpAwarded: 10,
  totalXp: 100,
  leveledUp: false,
  newLevel: 2,
  momentum: 1,
  isComeback: false,
  unlockedAchievements: [],
  ...over,
});

describe("planFocus", () => {
  it("treats a task without steps as one implicit step", () => {
    const plan = planFocus("Write report", [], new Set(), []);
    expect(plan.steps).toEqual([]);
    expect(plan.queue).toHaveLength(1);
    expect(plan.queue[0]).toMatchObject({ id: null, title: "Write report" });
    expect(plan.wrapUp).toBe(false);
  });

  it("starts at the first step that isn't done", () => {
    const plan = planFocus("T", [step("1", true), step("2"), step("3")], new Set(), []);
    expect(plan.queue.map((s) => s.key)).toEqual(["2", "3"]);
    expect(plan.steps).toHaveLength(3);
  });

  it("counts steps finished this visit before the server catches up", () => {
    const plan = planFocus("T", [step("1"), step("2")], new Set(["1"]), []);
    expect(plan.queue.map((s) => s.key)).toEqual(["2"]);
    expect(plan.steps[0].completed).toBe(true);
  });

  it("moves skipped steps to the back, in the order they were skipped", () => {
    const steps = [step("1"), step("2"), step("3"), step("4")];
    expect(planFocus("T", steps, new Set(), ["1"]).queue.map((s) => s.key)).toEqual(["2", "3", "4", "1"]);
    expect(planFocus("T", steps, new Set(), ["1", "2"]).queue.map((s) => s.key)).toEqual(["3", "4", "1", "2"]);
    expect(planFocus("T", steps, new Set(), ["2", "1", "3", "4"]).queue.map((s) => s.key)).toEqual(["2", "1", "3", "4"]);
  });

  it("ignores skipped steps that are already done", () => {
    const plan = planFocus("T", [step("1"), step("2")], new Set(["1"]), ["1"]);
    expect(plan.queue.map((s) => s.key)).toEqual(["2"]);
  });

  it("falls back to wrapping up the task when every step is done", () => {
    const plan = planFocus("Big thing", [step("1", true), step("2", true)], new Set(), []);
    expect(plan.wrapUp).toBe(true);
    expect(plan.queue).toHaveLength(1);
    expect(plan.queue[0]).toMatchObject({ id: null, title: "Big thing" });
  });
});

describe("focusEyebrow", () => {
  const steps = [step("1"), step("2"), step("3")];

  it("says which step you're on", () => {
    const plan = planFocus("T", steps, new Set(["1"]), []);
    expect(focusEyebrow(plan, "2")).toBe("Step 2 of 3");
  });

  it("uses the step's real position even after skipping", () => {
    const plan = planFocus("T", steps, new Set(), ["1"]);
    expect(focusEyebrow(plan, plan.queue[0].key)).toBe("Step 2 of 3");
  });

  it("is gentle when there are no steps or they're all done", () => {
    expect(focusEyebrow(planFocus("T", [], new Set(), []), "task")).toBe("Just this one");
    expect(focusEyebrow(planFocus("T", [step("1", true)], new Set(), []), "task")).toBe("All steps done");
  });
});

describe("clock formatting", () => {
  it("formats minutes and seconds", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(754)).toBe("12:34");
    expect(formatClock(1500)).toBe("25:00");
  });

  it("adds hours when needed and never goes negative", () => {
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatClock(-4)).toBe("0:00");
    expect(formatClock(59.9)).toBe("0:59");
  });

  it("reads out loud sensibly", () => {
    expect(spokenClock(754)).toBe("12 minutes 34 seconds");
    expect(spokenClock(61)).toBe("1 minute 1 second");
    expect(spokenClock(3600)).toBe("1 hour");
    expect(spokenClock(0)).toBe("0 seconds");
  });
});

describe("timer choice", () => {
  it("accepts whole minutes in range", () => {
    expect(parseCustomMinutes("20")).toBe(20);
    expect(parseCustomMinutes(" 1 ")).toBe(1);
    expect(parseCustomMinutes("180")).toBe(180);
  });

  it("rejects everything else", () => {
    for (const bad of ["", "0", "181", "-5", "2.5", "abc", "1e2", "0020"]) {
      expect(parseCustomMinutes(bad)).toBeNull();
    }
  });

  it("resolves presets, no timer, and custom", () => {
    expect(resolveTimer("none", "")).toEqual({ valid: true, minutes: null });
    expect(resolveTimer("25", "")).toEqual({ valid: true, minutes: 25 });
    expect(resolveTimer("custom", "40")).toEqual({ valid: true, minutes: 40 });
    expect(resolveTimer("custom", "")).toEqual({ valid: false, minutes: null });
  });
});

describe("rewards", () => {
  it("merges two rewards the way one celebration should read", () => {
    const merged = mergeRewards(
      reward({ xpAwarded: 25, totalXp: 100, newLevel: 2, momentum: 2, unlockedAchievements: ["A"] }),
      reward({ xpAwarded: 15, totalXp: 120, newLevel: 3, momentum: 3, leveledUp: true, unlockedAchievements: ["B"] }),
    );
    expect(merged).toEqual({
      xpAwarded: 40,
      totalXp: 120,
      leveledUp: true,
      newLevel: 3,
      momentum: 3,
      isComeback: false,
      unlockedAchievements: ["A", "B"],
    });
  });

  it("keeps whichever reward exists", () => {
    const only = reward();
    expect(mergeRewards(only, null)).toBe(only);
    expect(mergeRewards(null, only)).toBe(only);
    expect(mergeRewards(null, null)).toBeNull();
  });

  it("OR-s comeback", () => {
    expect(mergeRewards(reward({ isComeback: true }), reward())?.isComeback).toBe(true);
    expect(mergeRewards(reward(), reward({ isComeback: true }))?.isComeback).toBe(true);
  });

  it("folds the focus session into the task outcome and keeps the rest", () => {
    const task: CompletionOutcome = {
      reward: reward({ xpAwarded: 10 }),
      oneMore: { taskId: "x", title: "Tiny", minutes: 3 },
      bossDefeated: null,
      questCompleted: "Daily",
    };
    const focus: CompletionOutcome = { reward: reward({ xpAwarded: 15 }), oneMore: null, bossDefeated: null, questCompleted: null };
    const merged = mergeOutcomes(task, focus);
    expect(merged.reward?.xpAwarded).toBe(25);
    expect(merged.oneMore).toEqual(task.oneMore);
    expect(merged.questCompleted).toBe("Daily");
    expect(mergeOutcomes(task, null)).toEqual(task);
  });
});

describe("headlineSize", () => {
  it("shrinks for long titles", () => {
    expect(headlineSize("Call mum")).toContain("text-5xl");
    expect(headlineSize("x".repeat(60))).toContain("text-4xl");
    expect(headlineSize("x".repeat(120))).toContain("text-3xl");
  });
});
