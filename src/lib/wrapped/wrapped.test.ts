import { describe, expect, it } from "vitest";
import { computeWrapped, wordForWeek } from "./wrapped";

describe("Ta-Da List", () => {
  it("only counts what was done, and finds the favourite kind, time and day", () => {
    const stats = computeWrapped(
      [
        { title: "Pay rent", taskType: "bills", completedAt: "2026-10-20T04:00:00Z", felt: "easier" }, // Tue 9:30 Kolkata
        { title: "Call mom", taskType: "calls", completedAt: "2026-10-20T05:00:00Z" },
        { title: "Reply Priya", taskType: "calls", completedAt: "2026-10-21T05:00:00Z" },
      ],
      [{ actualMinutes: 10 }, { actualMinutes: 25 }, { actualMinutes: null }],
      1,
      "Asia/Kolkata",
    );
    expect(stats.done).toBe(3);
    expect(stats.topType).toBe("Calls and replies");
    expect(stats.bestTime).toBe("mornings");
    expect(stats.bestDay).toBe("Tuesday");
    expect(stats.focusMinutes).toBe(35);
    expect(stats.longestFocus).toBe(25);
    expect(stats.word).toBe("Resilient");
    expect(stats.easier).toBe(1);
  });

  it("is kind about a quiet week", () => {
    const stats = computeWrapped([], [], 0, "UTC");
    expect(stats.done).toBe(0);
    expect(stats.topType).toBeNull();
    expect(wordForWeek(0, 0)).toBe("Resting");
  });
});
