import { describe, expect, it } from "vitest";
import { getWeekDates, weeklyProgress } from "./habit-service";
import type { HabitCompletion } from "@/types/habit";

function makeCompletion(date: string, status: HabitCompletion["status"]): HabitCompletion {
  return { id: date, habitId: "h1", userId: "u1", date, status, createdAt: date };
}

describe("getWeekDates", () => {
  it("returns Monday through Sunday for a mid-week date", () => {
    // 2026-09-08 is a Tuesday (UTC).
    const dates = getWeekDates(new Date("2026-09-08T12:00:00Z"));
    expect(dates).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
  });

  it("rolls a Sunday back to the Monday that started its week", () => {
    // 2026-09-13 is a Sunday.
    const dates = getWeekDates(new Date("2026-09-13T12:00:00Z"));
    expect(dates[0]).toBe("2026-09-07");
    expect(dates[6]).toBe("2026-09-13");
  });
});

describe("weeklyProgress", () => {
  const weekDates = getWeekDates(new Date("2026-09-08T12:00:00Z"));

  it("counts completed and partial days toward progress, not skipped", () => {
    const completions = [
      makeCompletion("2026-09-07", "completed"),
      makeCompletion("2026-09-08", "completed"),
      makeCompletion("2026-09-09", "partial"),
      makeCompletion("2026-09-10", "skipped"),
    ];
    const result = weeklyProgress(completions, weekDates);
    expect(result.completedCount).toBe(3);
  });

  it("ignores completions outside the given week", () => {
    const completions = [makeCompletion("2026-08-01", "completed")];
    const result = weeklyProgress(completions, weekDates);
    expect(result.completedCount).toBe(0);
  });

  it("leaves untouched days undefined rather than defaulting to skipped", () => {
    const result = weeklyProgress([], weekDates);
    expect(result.statusByDate["2026-09-07"]).toBeUndefined();
  });
});
