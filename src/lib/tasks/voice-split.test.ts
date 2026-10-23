import { describe, expect, it } from "vitest";
import { splitSpoken } from "./voice-split";

describe("splitSpoken", () => {
  it("splits a ramble into tasks and reminders", () => {
    const items = splitSpoken("Okay so I need to pay rent, call mom and then remind me to take my meds. Clean the desk");
    expect(items).toEqual([
      { title: "Pay rent", kind: "task" },
      { title: "Call mom", kind: "task" },
      { title: "Take my meds", kind: "reminder" },
      { title: "Clean the desk", kind: "task" },
    ]);
  });

  it("keeps 'and' inside a task", () => {
    expect(splitSpoken("buy milk and eggs")).toEqual([{ title: "Buy milk and eggs", kind: "task" }]);
  });

  it("keeps spoken times in one piece", () => {
    expect(splitSpoken("Remind me to take medication every single day at 10.30 p.m. Pay rent tomorrow.")).toEqual([
      { title: "Take medication every single day at 10:30 pm", kind: "reminder" },
      { title: "Pay rent tomorrow", kind: "task" },
    ]);
  });

  it("ignores empty bits", () => {
    expect(splitSpoken(" , . um ")).toEqual([]);
  });
});
