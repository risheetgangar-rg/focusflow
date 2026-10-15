import { describe, expect, it } from "vitest";
import { describeDue } from "./format";

const tz = "Asia/Kolkata";
// Tuesday 8 Sep 2026, 14:00 in Kolkata.
const now = new Date("2026-09-08T08:30:00Z");

describe("describeDue", () => {
  it("shows today with the clock time", () => {
    const due = new Date("2026-09-08T12:30:00Z"); // 18:00 IST
    expect(describeDue(due.toISOString(), now, tz)).toEqual({ label: "Today · 6:00 PM", tone: "today" });
  });

  it("omits the clock for date-only (local midnight) due dates", () => {
    const due = new Date("2026-09-09T18:30:00Z"); // midnight IST on the 10th
    expect(describeDue(due.toISOString(), now, tz)).toEqual({ label: "Thursday", tone: "soon" });
  });

  it("calls tomorrow tomorrow", () => {
    const due = new Date("2026-09-09T03:30:00Z"); // 09:00 IST on the 9th
    expect(describeDue(due.toISOString(), now, tz).label).toBe("Tomorrow · 9:00 AM");
  });

  it("states past dates as a neutral fact, never an alarm", () => {
    const yesterday = new Date("2026-09-06T18:30:00Z"); // midnight IST on the 7th
    expect(describeDue(yesterday.toISOString(), now, tz)).toEqual({ label: "Was due yesterday", tone: "past" });
    const older = new Date("2026-09-02T18:30:00Z");
    expect(describeDue(older.toISOString(), now, tz)).toEqual({ label: "Was due Thu, Sep 3", tone: "past" });
  });

  it("uses a plain date for anything a week or more out", () => {
    const due = new Date("2026-09-20T18:30:00Z");
    expect(describeDue(due.toISOString(), now, tz)).toEqual({ label: "Sep 21", tone: "later" });
  });
});
