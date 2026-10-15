import type { CSSProperties } from "react";

export interface HabitSwatch {
  value: string;
  name: string;
}

/**
 * A habit's color is data the person picks (it's stored with the habit), so
 * these are the one place hex values live. All of them carry white ink well.
 */
export const HABIT_SWATCHES: HabitSwatch[] = [
  { value: "#5b4bf0", name: "Iris" },
  { value: "#3f9d6b", name: "Meadow" },
  { value: "#d9731f", name: "Tangerine" },
  { value: "#3b82c4", name: "Ocean" },
  { value: "#d4537e", name: "Blossom" },
  { value: "#9a5bc7", name: "Plum" },
  { value: "#2a9d9a", name: "Lagoon" },
  { value: "#c9704f", name: "Clay" },
];

export const DEFAULT_HABIT_COLOR = HABIT_SWATCHES[0].value;

const WHITE = "#ffffff";
const DARK_INK = "#171715";

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Is `color` a plain hex color we can safely drop into a style attribute? */
export function isHexColor(color: string | null | undefined): color is string {
  return typeof color === "string" && parseHex(color) !== null;
}

/** White or near-black, whichever reads better on top of `color` (icons need 3:1). */
export function inkOn(color: string): string {
  const rgb = parseHex(color);
  if (!rgb) return WHITE;
  const whiteContrast = 1.05 / (relativeLuminance(rgb) + 0.05);
  return whiteContrast >= 3 ? WHITE : DARK_INK;
}

/**
 * Re-points the brand tokens at a habit's own color. Put this on a wrapper and
 * everything inside that uses `bg-brand`, `stroke-brand`, `text-brand-foreground`
 * etc. recolors itself. Falls back to the theme brand for odd stored values.
 */
export function habitStyle(color: string | null | undefined): CSSProperties | undefined {
  if (!isHexColor(color)) return undefined;
  return { "--brand": color, "--brand-foreground": inkOn(color) } as CSSProperties;
}
