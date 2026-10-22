import type { CSSProperties, HTMLAttributes, JSX } from "react";

export interface FluxLinesProps extends Omit<HTMLAttributes<HTMLDivElement>, "style"> {
  colors?: string[];
  speed?: number;
  scale?: number;
  turbulence?: number;
  fluidity?: number;
  rimWidth?: number;
  sharpness?: number;
  shimmer?: number;
  glow?: number;
  lineWidth?: number;
  flowDirection?: "up" | "down" | "left" | "right";
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  mouseDampening?: number;
  clickSwirl?: boolean;
  intro?: boolean;
  lightMode?: boolean;
  transparent?: boolean;
  backgroundColor?: string;
  paused?: boolean;
  dpr?: number;
  mixBlendMode?: CSSProperties["mixBlendMode"];
  className?: string;
  style?: CSSProperties;
}

declare function FluxLines(props: FluxLinesProps): JSX.Element;
export default FluxLines;
