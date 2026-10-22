import { describe, expect, it } from "vitest";
import { cheerFor, progressFor, type History } from "./medals";

const done = (id: string, at: string, extra: Partial<History["done"][number]> = {}) => ({
  id,
  completedAt: at,
  priority: "medium",
  kind: "task",
  felt: null,
  ...extra,
});

describe("medals", () => {
  it("starts with nothing and never takes a medal away", () => {
    expect(progressFor({ done: [], focus: [], comebacks: 0 }, "UTC")).toMatchObject({ xp: 0, earned: [] });
  });

  it("gives XP for what was done and unlocks the right medals", () => {
    const h: History = {
      done: [
        done("a", "2026-10-20T07:00:00Z", { priority: "critical" }),
        done("b", "2026-10-20T12:00:00Z"),
        done("c", "2026-10-20T23:00:00Z", { kind: "reminder" }),
      ],
      focus: [{ id: "f", minutes: 30, completed: true }],
      comebacks: 0,
    };
    const p = progressFor(h, "UTC");
    expect(p.xp).toBe(25 + 10 + 5 + 30);
    expect(p.earned).toEqual(
      expect.arrayContaining(["first_step", "locked_in", "hat_trick", "deep_dive", "early_bird", "night_owl", "brave"]),
    );
    expect(p.earned).not.toContain("tiny_wins");
  });

  it("cheers the same way for the same task", () => {
    expect(cheerFor("abc")).toBe(cheerFor("abc"));
  });
});
