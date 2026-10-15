import { describe, expect, it } from "vitest";
import {
  addDaysToDateString,
  getWeekDatesInTz,
  isValidTimezone,
  resolveTimezone,
  zonedDateString,
  zonedDayBoundsUtc,
  zonedTimeString,
  zonedTimeToUtc,
  zonedWallClock,
} from "./tz";

describe("timezone validation", () => {
  it("accepts real zones and rejects junk", () => {
    expect(isValidTimezone("Asia/Kolkata")).toBe(true);
    expect(isValidTimezone("Not/AZone")).toBe(false);
    expect(isValidTimezone(null)).toBe(false);
  });

  it("falls back to UTC", () => {
    expect(resolveTimezone("nope")).toBe("UTC");
    expect(resolveTimezone("America/New_York")).toBe("America/New_York");
  });
});

describe("zonedDateString / zonedTimeString", () => {
  // 23:30 UTC on Sep 8 is already 05:00 on Sep 9 in India.
  const instant = new Date("2026-09-08T23:30:00Z");

  it("rolls the calendar date forward for zones ahead of UTC", () => {
    expect(zonedDateString(instant, "Asia/Kolkata")).toBe("2026-09-09");
    expect(zonedTimeString(instant, "Asia/Kolkata")).toBe("05:00");
  });

  it("keeps UTC as is", () => {
    expect(zonedDateString(instant, "UTC")).toBe("2026-09-08");
  });

  it("rolls the calendar date back for zones behind UTC", () => {
    expect(zonedDateString(new Date("2026-09-09T02:00:00Z"), "America/Los_Angeles")).toBe("2026-09-08");
  });
});

describe("zonedTimeToUtc", () => {
  it("converts 6pm India time to 12:30 UTC", () => {
    expect(zonedTimeToUtc("2026-10-08", "18:00", "Asia/Kolkata").toISOString()).toBe(
      "2026-10-08T12:30:00.000Z",
    );
  });

  it("respects daylight saving in New York (summer is UTC-4, winter UTC-5)", () => {
    expect(zonedTimeToUtc("2026-07-01", "09:00", "America/New_York").toISOString()).toBe(
      "2026-07-01T13:00:00.000Z",
    );
    expect(zonedTimeToUtc("2026-12-01", "09:00", "America/New_York").toISOString()).toBe(
      "2026-12-01T14:00:00.000Z",
    );
  });

  it("defaults a missing time to midnight in that zone", () => {
    expect(zonedTimeToUtc("2026-10-08", undefined, "Asia/Kolkata").toISOString()).toBe(
      "2026-10-07T18:30:00.000Z",
    );
  });

  it("round-trips through zonedDateString/zonedTimeString", () => {
    const utc = zonedTimeToUtc("2026-03-15", "07:45", "Europe/Berlin");
    expect(zonedDateString(utc, "Europe/Berlin")).toBe("2026-03-15");
    expect(zonedTimeString(utc, "Europe/Berlin")).toBe("07:45");
  });
});

describe("week and day helpers", () => {
  it("builds a Monday-first week in the user's timezone", () => {
    // Sunday evening UTC is already Monday in India, so the week starts that day.
    const week = getWeekDatesInTz(new Date("2026-09-13T20:00:00Z"), "Asia/Kolkata");
    expect(week[0]).toBe("2026-09-14");
    expect(week[6]).toBe("2026-09-20");
  });

  it("treats Sunday as the last day of the week", () => {
    const week = getWeekDatesInTz(new Date("2026-09-13T12:00:00Z"), "UTC");
    expect(week[0]).toBe("2026-09-07");
    expect(week[6]).toBe("2026-09-13");
  });

  it("adds days across month boundaries", () => {
    expect(addDaysToDateString("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysToDateString("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("computes the UTC bounds of a local day", () => {
    const { start, end } = zonedDayBoundsUtc("2026-10-08", "Asia/Kolkata");
    expect(start.toISOString()).toBe("2026-10-07T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-10-08T18:30:00.000Z");
  });

  it("builds a pseudo-local date that reads the wall clock", () => {
    const wall = zonedWallClock(new Date("2026-09-08T12:30:00Z"), "Asia/Kolkata");
    expect(wall.getHours()).toBe(18);
    expect(wall.getMinutes()).toBe(0);
    expect(wall.getDate()).toBe(8);
  });
});
