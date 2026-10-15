import { describe, expect, it } from "vitest";
import {
  EXAMPLES,
  hasBlankTitle,
  taskCountLabel,
  toEditable,
  toPayload,
  wordCount,
} from "@/components/brain-dump/brain-dump-items";
import { getTaskParser } from "@/lib/ai/task-parser";
import { parsedBrainDumpSchema } from "@/lib/validation/brain-dump";

describe("brain dump items", () => {
  it("gives every parsed item its own key, even across batches", () => {
    const first = toEditable([{ title: "A" }, { title: "B" }], 1);
    const second = toEditable([{ title: "A" }], 2);
    expect(new Set([...first, ...second].map((i) => i.key)).size).toBe(3);
  });

  it("sends the server only task fields, and the result passes its validation", () => {
    const items = toEditable(
      [
        { title: "  Call Rahul  ", dueDate: "2026-10-08", dueTime: "18:00", priority: "high" },
        { title: "Pay bill", dueDate: "", dueTime: "" },
      ],
      1,
    );
    const payload = toPayload(items);
    expect(payload[0]).toMatchObject({ title: "Call Rahul", dueDate: "2026-10-08", dueTime: "18:00", priority: "high" });
    expect(payload[1].dueDate).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("key");
    expect(parsedBrainDumpSchema.safeParse({ items: JSON.parse(JSON.stringify(payload)) }).success).toBe(true);
  });

  it("notices a blank title", () => {
    expect(hasBlankTitle(toEditable([{ title: "Fine" }, { title: "   " }], 1))).toBe(true);
    expect(hasBlankTitle(toEditable([{ title: "Fine" }], 1))).toBe(false);
  });

  it("counts words and labels tasks", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("  one   two\nthree ")).toBe(3);
    expect(taskCountLabel(1)).toBe("1 task");
    expect(taskCountLabel(3)).toBe("3 tasks");
  });

  it("only suggests examples the parser actually understands", () => {
    const now = new Date(2026, 9, 7, 12, 0, 0);
    const found = EXAMPLES.map((example) => getTaskParser().parse(example, now).length);
    expect(found).toEqual([3, 3, 2]);
  });
});
