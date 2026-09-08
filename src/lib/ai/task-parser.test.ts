import { describe, expect, it } from "vitest";
import { DeterministicTaskParser } from "./task-parser";

// Wednesday, matches the spec's example ("tomorrow" -> Thursday).
const now = new Date("2026-09-09T09:00:00");
const parser = new DeterministicTaskParser();

describe("DeterministicTaskParser", () => {
  it("splits the spec's example into three items with carried-forward dates", () => {
    const items = parser.parse(
      "Tomorrow call Rahul at 6 and finish presentation, and pay electricity bill Friday.",
      now,
    );

    expect(items).toHaveLength(3);
    expect(items[0].title).toBe("Call Rahul");
    expect(items[0].dueDate).toBe("2026-09-10");
    expect(items[0].dueTime).toBe("18:00");

    expect(items[1].title).toBe("Finish presentation");
    expect(items[1].dueDate).toBe("2026-09-10"); // carried forward from item 1

    expect(items[2].title).toBe("Pay electricity bill");
    expect(items[2].dueDate).toBe("2026-09-11"); // next Friday, its own date
  });

  it("never invents a date when none is mentioned", () => {
    const items = parser.parse("Water the plants", now);
    expect(items[0].dueDate).toBeUndefined();
  });

  it("recognizes today and does not shift it", () => {
    const items = parser.parse("Reply to professor today", now);
    expect(items[0].dueDate).toBe("2026-09-09");
  });

  it("flags urgent language as critical priority", () => {
    const items = parser.parse("This is urgent, submit the form", now);
    expect(items[0].priority).toBe("critical");
  });

  it("leaves priority unset when nothing suggests urgency", () => {
    const items = parser.parse("Clean the desk", now);
    expect(items[0].priority).toBeUndefined();
  });

  it("handles a single item with no separators", () => {
    const items = parser.parse("Buy groceries", now);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Buy groceries");
  });
});
