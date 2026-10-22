import { describe, expect, it } from "vitest";
import { toneOf } from "./tone";

const now = new Date("2026-10-25T10:00:00Z");
const inHours = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();
const t = (priority: string, dueAt: string | null, mustDo = false) => ({ priority: priority as never, dueAt, mustDo });

describe("toneOf", () => {
  it("parks anything whose day has passed, whatever its priority", () => {
    expect(toneOf(t("critical", inHours(-2)), now)).toBe("parked");
  });

  it("puts High and Critical in 'right now'", () => {
    expect(toneOf(t("high", inHours(200)), now)).toBe("now");
    expect(toneOf(t("critical", null), now)).toBe("now");
  });

  it("moves things up a colour as the date gets close", () => {
    expect(toneOf(t("medium", inHours(100)), now)).toBe("soon");
    expect(toneOf(t("medium", inHours(10)), now)).toBe("now");
    expect(toneOf(t("low", inHours(100)), now)).toBe("later");
    expect(toneOf(t("low", inHours(30)), now)).toBe("soon");
  });
});
