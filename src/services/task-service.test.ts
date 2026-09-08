import { describe, expect, it } from "vitest";
import { resolveRescheduleDate } from "./task-service";

describe("resolveRescheduleDate", () => {
  it("pushes later_today forward by a few hours", () => {
    const now = new Date();
    const result = resolveRescheduleDate("later_today");
    expect(result.getTime()).toBeGreaterThan(now.getTime());
  });

  it("sets tomorrow to 9am the next day", () => {
    const result = resolveRescheduleDate("tomorrow");
    const expectedDay = new Date();
    expectedDay.setDate(expectedDay.getDate() + 1);
    expect(result.getDate()).toBe(expectedDay.getDate());
    expect(result.getHours()).toBe(9);
  });

  it("throws for custom without a date", () => {
    expect(() => resolveRescheduleDate("custom")).toThrow();
  });

  it("returns the given date for custom", () => {
    const custom = new Date("2026-12-25T09:00:00");
    expect(resolveRescheduleDate("custom", custom)).toBe(custom);
  });
});
