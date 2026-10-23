import { describe, expect, it } from "vitest";
import { dueFrom } from "./when";

const tz = "Asia/Kolkata";
const now = new Date("2026-10-23T08:30:00Z"); // 2 pm in Kolkata

describe("dueFrom", () => {
  it("uses today when the time hasn't passed yet", () => {
    expect(dueFrom({ time: "22:30" }, tz, now)).toBe("2026-10-23T17:00:00.000Z");
  });

  it("rolls to tomorrow when the time has passed", () => {
    expect(dueFrom({ time: "09:00" }, tz, now)).toBe("2026-10-24T03:30:00.000Z");
  });

  it("gives a day without a time that evening, and nothing without either", () => {
    expect(dueFrom({ date: "2026-10-25" }, tz, now)).toBe("2026-10-25T15:30:00.000Z");
    expect(dueFrom({}, tz, now)).toBeNull();
  });
});
