import { describe, expect, it } from "vitest";
import { resolveRescheduleDate } from "./task-service";

describe("resolveRescheduleDate", () => {
  // 15:00 UTC = 20:30 in Kolkata.
  const now = new Date("2026-09-08T15:00:00Z");

  it("moves 'tomorrow' to 9am the next day in the user's timezone", () => {
    const result = resolveRescheduleDate("tomorrow", undefined, "Asia/Kolkata", now);
    expect(result.toISOString()).toBe("2026-09-09T03:30:00.000Z"); // 09:00 IST
  });

  it("pushes 'later today' a few hours out when that's still today", () => {
    const earlier = new Date("2026-09-08T05:00:00Z"); // 10:30 IST
    const result = resolveRescheduleDate("later_today", undefined, "Asia/Kolkata", earlier);
    expect(result.getTime()).toBe(earlier.getTime() + 3 * 3_600_000);
  });

  it("never pushes 'later today' past midnight into tomorrow", () => {
    const result = resolveRescheduleDate("later_today", undefined, "Asia/Kolkata", now); // 20:30 IST
    // 3h later would be 23:30 IST (still today) so it stays today.
    expect(result.toISOString()).toBe("2026-09-08T18:00:00.000Z");
    const lateNight = new Date("2026-09-08T17:30:00Z"); // 23:00 IST
    const clamped = resolveRescheduleDate("later_today", undefined, "Asia/Kolkata", lateNight);
    expect(clamped.getTime()).toBe(lateNight.getTime() + 15 * 60_000);
  });

  it("moves 'this week' to the coming Sunday morning", () => {
    // Tuesday in Kolkata.
    const result = resolveRescheduleDate("this_week", undefined, "Asia/Kolkata", now);
    expect(result.toISOString()).toBe("2026-09-13T03:30:00.000Z");
  });

  it("throws for custom without a date", () => {
    expect(() => resolveRescheduleDate("custom")).toThrow();
  });

  it("returns the given date for custom", () => {
    const custom = new Date("2026-12-25T09:00:00Z");
    expect(resolveRescheduleDate("custom", custom)).toBe(custom);
  });
});
