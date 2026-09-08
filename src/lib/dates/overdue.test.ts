import { describe, expect, it } from "vitest";
import { isDueToday, isOverdue } from "./overdue";

const now = new Date("2026-09-08T12:00:00Z");

describe("isOverdue", () => {
  it("is true for a pending task with a past due date", () => {
    expect(isOverdue("2026-09-07T12:00:00Z", "pending", now)).toBe(true);
  });

  it("is false for a pending task with a future due date", () => {
    expect(isOverdue("2026-09-09T12:00:00Z", "pending", now)).toBe(false);
  });

  it("is false once completed, even if the due date has passed", () => {
    expect(isOverdue("2026-09-07T12:00:00Z", "completed", now)).toBe(false);
  });

  it("is false with no due date", () => {
    expect(isOverdue(null, "pending", now)).toBe(false);
  });
});

describe("isDueToday", () => {
  it("is true for a due date on the same calendar day", () => {
    expect(isDueToday("2026-09-08T12:30:00Z", now)).toBe(true);
  });

  it("is false for a due date on a different day", () => {
    expect(isDueToday("2026-09-10T12:00:00Z", now)).toBe(false);
  });

  it("is false with no due date", () => {
    expect(isDueToday(null, now)).toBe(false);
  });
});
