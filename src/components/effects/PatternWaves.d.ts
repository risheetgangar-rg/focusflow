import type { CSSProperties, JSX } from "react";

export interface PatternWavesProps {
  preset?: "silk" | "ocean" | "pond" | "lines" | "terminal" | "mesh";
  pattern?: "dot" | "square" | "plus" | "line" | "glyph";
  wave?: "silk" | "swell" | "ripple";
  color?: string;
  backgroundColor?: string;
  spacing?: number;
  markSize?: number;
  depth?: number;
  light?: number;
  shine?: number;
  contrast?: number;
  speed?: number;
  scale?: number;
  direction?: number;
  opacity?: number;
  fade?: "edges" | "center" | "bottom" | "top" | "none";
  fadeSize?: number;
  characters?: string;
  interactive?: boolean;
  cursorSize?: number;
  cursorStrength?: number;
  intro?: boolean;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
}

declare function PatternWaves(props: PatternWavesProps): JSX.Element;
export default PatternWaves;
