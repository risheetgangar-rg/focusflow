import { describe, expect, it } from "vitest";
import { readNotice, safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/tasks")).toBe("/tasks");
    expect(safeNextPath("/focus/abc?x=1#top")).toBe("/focus/abc?x=1#top");
  });

  it("falls back when missing", () => {
    expect(safeNextPath(undefined)).toBe("/today");
    expect(safeNextPath("")).toBe("/today");
    expect(safeNextPath(["/tasks", "/habits"])).toBe("/tasks");
  });

  it("rejects anything that could leave the site", () => {
    expect(safeNextPath("https://evil.example")).toBe("/today");
    expect(safeNextPath("//evil.example")).toBe("/today");
    expect(safeNextPath("/\\evil.example")).toBe("/today");
    expect(safeNextPath("tasks")).toBe("/today");
    expect(safeNextPath("/ok\nSet-Cookie: a=b")).toBe("/today");
    expect(safeNextPath("javascript:alert(1)")).toBe("/today");
  });

  it("uses a custom fallback", () => {
    expect(safeNextPath("//x", "/onboarding")).toBe("/onboarding");
  });
});

describe("readNotice", () => {
  it("shows short plain sentences", () => {
    expect(readNotice("That link expired or was already used. Request a new one.")).toBe(
      "That link expired or was already used. Request a new one.",
    );
  });

  it("returns nothing when empty", () => {
    expect(readNotice(undefined)).toBeUndefined();
    expect(readNotice("   ")).toBeUndefined();
  });

  it("does not repeat links, markup or very long text", () => {
    expect(readNotice("Visit https://evil.example now")).toBe("Something went wrong. Try again?");
    expect(readNotice("<b>hi</b>")).toBe("Something went wrong. Try again?");
    expect(readNotice("a".repeat(300))).toBe("Something went wrong. Try again?");
  });
});
