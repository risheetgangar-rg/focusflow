import type { CSSProperties } from "react";
import { COMPANION_STAGE_NAMES, type CompanionStage } from "@/lib/gamification/rules";
import { cn } from "@/lib/utils";

export type CompanionMood = "happy" | "cheer" | "sleepy";

const body: CSSProperties = { fill: "var(--brand)" };
const light: CSSProperties = { fill: "color-mix(in oklab, var(--brand) 52%, white)" };
const dark: CSSProperties = { fill: "color-mix(in oklab, var(--brand) 76%, black)" };
const INK = "#1d1b2b";
const GOLD = "#ffcf5c";

function Sparkle({ x, y, s = 1, delay = 0 }: { x: number; y: number; s?: number; delay?: number }) {
  return (
    <path
      d="M0 -7 Q1 -1 7 0 Q1 1 0 7 Q-1 1 -7 0 Q-1 -1 0 -7Z"
      fill={GOLD}
      transform={`translate(${x} ${y}) scale(${s})`}
      className="animate-breathe"
      style={{ animationDelay: `${delay}s`, transformBox: "fill-box", transformOrigin: "center" }}
    />
  );
}

/**
 * Pip, the optional companion. Evolves with level (Spark -> Glow -> Star).
 * Purely decorative, so it is hidden from screen readers.
 */
export function Companion({
  stage,
  mood = "happy",
  size = 96,
  float = true,
  className,
}: {
  stage: CompanionStage;
  mood?: CompanionMood;
  size?: number;
  float?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden
      role="presentation"
      data-stage={COMPANION_STAGE_NAMES[stage]}
      className={cn(float && "animate-float", "overflow-visible", className)}
    >
      {/* glow halo from stage 2 */}
      {stage >= 2 && <circle cx="60" cy="66" r="50" style={body} opacity="0.13" className="animate-breathe" />}

      {/* wings at stage 3 */}
      {stage === 3 && (
        <>
          <path d="M30 62 Q4 40 10 76 Q20 72 30 78Z" style={light} />
          <path d="M90 62 Q116 40 110 76 Q100 72 90 78Z" style={light} />
        </>
      )}

      {/* ears at stage 2+ */}
      {stage >= 2 && (
        <>
          <path d="M37 46 L32 24 L53 38Z" style={body} />
          <path d="M83 46 L88 24 L67 38Z" style={body} />
          <path d="M39 42 L36 31 L47 38Z" style={light} />
          <path d="M81 42 L84 31 L73 38Z" style={light} />
        </>
      )}

      {/* spark antenna at stage 1 */}
      {stage === 1 && (
        <>
          <path d="M60 38 Q59 27 67 22" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="67" cy="21" r="5" fill={GOLD} />
        </>
      )}

      {/* feet */}
      <ellipse cx="46" cy="99" rx="10" ry="5.5" style={dark} />
      <ellipse cx="74" cy="99" rx="10" ry="5.5" style={dark} />

      {/* body + belly */}
      <ellipse cx="60" cy="68" rx="35" ry="33" style={body} />
      <ellipse cx="60" cy="77" rx="22" ry="18" fill="white" opacity="0.3" />

      {/* crown at stage 3 / star at stage 2 */}
      {stage === 3 && <path d="M45 40 L49 27 L55 35 L60 24 L65 35 L71 27 L75 40Z" fill={GOLD} />}
      {stage === 2 && <path d="M60 41 L62.4 46.4 L68 47 L63.8 50.8 L65 56.4 L60 53.6 L55 56.4 L56.2 50.8 L52 47 L57.6 46.4Z" fill={GOLD} />}

      {/* eyes */}
      {mood === "happy" && (
        <>
          <circle cx="48" cy="64" r="4.6" fill={INK} />
          <circle cx="72" cy="64" r="4.6" fill={INK} />
          <circle cx="49.6" cy="62.4" r="1.6" fill="white" />
          <circle cx="73.6" cy="62.4" r="1.6" fill="white" />
        </>
      )}
      {mood === "cheer" && (
        <>
          <path d="M43 66 Q48 58 53 66" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M67 66 Q72 58 77 66" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      )}
      {mood === "sleepy" && (
        <>
          <path d="M43 64 Q48 69 53 64" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path d="M67 64 Q72 69 77 64" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* cheeks */}
      <ellipse cx="38" cy="74" rx="5.5" ry="3.4" fill="#ff9fb4" opacity="0.6" />
      <ellipse cx="82" cy="74" rx="5.5" ry="3.4" fill="#ff9fb4" opacity="0.6" />

      {/* mouth */}
      {mood === "happy" && (
        <path d="M53 74 Q60 82 67 74" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {mood === "cheer" && (
        <>
          <path d="M52 73 Q60 87 68 73Z" fill="#7b2d41" />
          <path d="M56 80 Q60 84 64 80 Q60 77 56 80Z" fill="#ff8ea3" />
        </>
      )}
      {mood === "sleepy" && <ellipse cx="60" cy="78" rx="3" ry="2.4" fill={INK} opacity="0.85" />}

      {/* sparkles at stage 3 */}
      {stage === 3 && (
        <>
          <Sparkle x={14} y={30} s={1} />
          <Sparkle x={108} y={26} s={1.2} delay={0.8} />
          <Sparkle x={100} y={96} s={0.8} delay={1.6} />
        </>
      )}
    </svg>
  );
}
