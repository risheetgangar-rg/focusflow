import { describe, expect, it } from "vitest";
import {
  cumulativeXpForLevel,
  isComeback,
  levelForXp,
  levelProgress,
  nextMomentum,
  pickSideQuest,
  xpForTaskCompletion,
} from "./gamification-service";

describe("xpForTaskCompletion", () => {
  it("rewards difficult (high friction) tasks the most", () => {
    expect(xpForTaskCompletion({ friction: 5, importance: 1 })).toBe(35);
  });

  it("rewards important tasks more than routine ones", () => {
    expect(xpForTaskCompletion({ friction: 1, importance: 5 })).toBe(25);
  });

  it("gives the base amount for an ordinary task", () => {
    expect(xpForTaskCompletion({ friction: 1, importance: 2 })).toBe(10);
  });
});

describe("levelForXp / levelProgress", () => {
  it("starts at level 1 with 0 xp", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("levels up once the cumulative threshold is reached", () => {
    expect(levelForXp(cumulativeXpForLevel(2) - 1)).toBe(1);
    expect(levelForXp(cumulativeXpForLevel(2))).toBe(2);
  });

  it("reports progress within the current level", () => {
    const progress = levelProgress(150);
    expect(progress.level).toBe(2);
    expect(progress.title).toBe("Getting Moving");
    expect(progress.xpIntoLevel).toBe(50);
  });
});

describe("nextMomentum", () => {
  const now = new Date("2026-09-08T12:00:00Z");

  it("starts a new session at 1 when there's no prior activity", () => {
    expect(nextMomentum(0, null, now)).toBe(1);
  });

  it("increments within an active session", () => {
    const recent = new Date(now.getTime() - 5 * 60_000).toISOString();
    expect(nextMomentum(2, recent, now)).toBe(3);
  });

  it("resets to 1 after a long gap", () => {
    const stale = new Date(now.getTime() - 4 * 3_600_000).toISOString();
    expect(nextMomentum(5, stale, now)).toBe(1);
  });
});

describe("isComeback", () => {
  const now = new Date("2026-09-08T12:00:00Z");

  it("is false for a brand new user", () => {
    expect(isComeback(null, now)).toBe(false);
  });

  it("is false for recent activity", () => {
    expect(isComeback(new Date(now.getTime() - 3_600_000).toISOString(), now)).toBe(false);
  });

  it("is true after 48+ hours away", () => {
    expect(isComeback(new Date(now.getTime() - 50 * 3_600_000).toISOString(), now)).toBe(true);
  });
});

describe("pickSideQuest", () => {
  it("is stable for the same seed", () => {
    expect(pickSideQuest("2026-09-08")).toBe(pickSideQuest("2026-09-08"));
  });
});
