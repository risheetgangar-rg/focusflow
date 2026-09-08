import { describe, expect, it } from "vitest";
import { nextOccurrence } from "./recurrence";

describe("nextOccurrence", () => {
  it("advances a day for daily recurrence", () => {
    const next = nextOccurrence("daily", new Date("2026-09-08T12:00:00Z"));
    expect(next.toISOString()).toBe("2026-09-09T12:00:00.000Z");
  });

  it("advances a week for weekly recurrence", () => {
    const next = nextOccurrence("weekly", new Date("2026-09-08T12:00:00Z"));
    expect(next.toISOString()).toBe("2026-09-15T12:00:00.000Z");
  });

  it("advances a month for monthly recurrence", () => {
    const next = nextOccurrence("monthly", new Date("2026-01-31T12:00:00Z"));
    // JS Date rolls Jan 31 + 1 month into early March since Feb has no 31st.
    expect(next.getUTCMonth()).toBe(2);
  });
});
