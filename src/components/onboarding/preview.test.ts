import { describe, expect, it } from "vitest";
import { toFocusAreaValues, ALL_FOCUS_AREAS } from "./options";
import { MAX_FIRST_TASKS, previewFirstTasks } from "./preview";

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
// 10:00 on Wednesday 7 Oct 2026, wall-clock local (the parser reads local getters).
const now = new Date(2026, 9, 7, 10, 0, 0);
const plain = (text: string | null) => (text ?? "").replace(/\s/g, " ");

describe("previewFirstTasks", () => {
  it("returns nothing for empty text", () => {
    expect(previewFirstTasks("   ", now, tz)).toEqual({ items: [], overflow: 0 });
  });

  it("reads a day and time, and labels them plainly", () => {
    const { items } = previewFirstTasks("Call the dentist tomorrow at 9", now, tz);
    expect(items).toHaveLength(1);
    expect(items[0].task).toEqual({ title: "Call the dentist", dueDate: "2026-10-08", dueTime: "09:00" });
    expect(plain(items[0].dueLabel)).toBe("Tomorrow · 9:00 AM");
  });

  it("never invents a deadline", () => {
    const { items } = previewFirstTasks("Reply to Sam", now, tz);
    expect(items[0].task).toEqual({ title: "Reply to Sam" });
    expect(items[0].dueLabel).toBeNull();
  });

  it("treats a bare time as today", () => {
    const { items } = previewFirstTasks("Call mum at 6", now, tz);
    expect(items[0].task.dueDate).toBe("2026-10-07");
    expect(items[0].task.dueTime).toBe("18:00");
    expect(plain(items[0].dueLabel)).toBe("Today · 6:00 PM");
  });

  it("labels priority in friendly words", () => {
    const { items } = previewFirstTasks("urgent Send the invoice", now, tz);
    expect(items[0].task.priority).toBe("critical");
    expect(items[0].priorityLabel).toBe("Urgent");
  });

  it("splits several things and caps how many it keeps", () => {
    const text = Array.from({ length: MAX_FIRST_TASKS + 2 }, (_, i) => `Task ${i + 1}`).join("; ");
    const preview = previewFirstTasks(text, now, tz);
    expect(preview.items).toHaveLength(MAX_FIRST_TASKS);
    expect(preview.overflow).toBe(2);
  });
});

describe("toFocusAreaValues", () => {
  it("passes through a partial selection", () => {
    expect(toFocusAreaValues(["starting", "habits"])).toEqual(["starting", "habits"]);
    expect(toFocusAreaValues([])).toEqual([]);
  });

  it("adds 'all' when every area is chosen", () => {
    expect(toFocusAreaValues([...ALL_FOCUS_AREAS])).toEqual([...ALL_FOCUS_AREAS, "all"]);
  });
});
