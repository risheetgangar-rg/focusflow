"use client";

import { useRef } from "react";

/*
 * "How long will it take?" as a clock you drag around. One full turn runs
 * from 5 minutes to 4 hours, snapping to friendly amounts. Arrow keys work too.
 */

export const DURATION_STOPS = [5, 10, 15, 20, 25, 30, 45, 60, 75, 90, 120, 150, 180, 240];

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} ${h === 1 ? "hour" : "hours"}`;
}

/** The stop for an angle in degrees, measured clockwise from 12 o'clock. */
export function stopForAngle(degrees: number): number {
  const turn = ((degrees % 360) + 360) % 360;
  const index = Math.round((turn / 360) * (DURATION_STOPS.length - 1));
  return DURATION_STOPS[Math.min(index, DURATION_STOPS.length - 1)];
}

function angleForStop(minutes: number): number {
  const index = DURATION_STOPS.findIndex((s) => s >= minutes);
  return ((index === -1 ? DURATION_STOPS.length - 1 : index) / (DURATION_STOPS.length - 1)) * 360;
}

const SIZE = 220;
const R = 88;
const C = SIZE / 2;

export function DurationDial({
  value,
  onChange,
  name,
}: {
  value: number | null;
  onChange: (minutes: number | null) => void;
  /** When set, a hidden input carries the value in a form. */
  name?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const angle = value === null ? 0 : angleForStop(value);
  const rad = ((angle - 90) * Math.PI) / 180;
  const knob = { x: C + R * Math.cos(rad), y: C + R * Math.sin(rad) };
  const circumference = 2 * Math.PI * R;

  function pick(clientX: number, clientY: number) {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return;
    const x = clientX - (box.left + box.width / 2);
    const y = clientY - (box.top + box.height / 2);
    const degrees = (Math.atan2(y, x) * 180) / Math.PI + 90;
    onChange(stopForAngle(degrees));
  }

  function step(delta: number) {
    const index = value === null ? -1 : DURATION_STOPS.indexOf(value);
    const next = Math.max(0, Math.min(DURATION_STOPS.length - 1, index + delta));
    onChange(DURATION_STOPS[next]);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <svg
        ref={svg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-52 cursor-grab touch-none rounded-full outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/30 active:cursor-grabbing"
        role="slider"
        tabIndex={0}
        aria-label="How long will it take"
        aria-valuemin={DURATION_STOPS[0]}
        aria-valuemax={DURATION_STOPS[DURATION_STOPS.length - 1]}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? "Not set" : formatDuration(value)}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => dragging.current && pick(e.clientX, e.clientY)}
        onPointerUp={() => (dragging.current = false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            step(1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            step(-1);
          }
        }}
      >
        {/* Clock ticks, one per stop. */}
        {DURATION_STOPS.slice(0, -1).map((s, i) => {
          const a = ((i / (DURATION_STOPS.length - 1)) * 360 - 90) * (Math.PI / 180);
          return (
            <line
              key={s}
              x1={C + (R + 14) * Math.cos(a)}
              y1={C + (R + 14) * Math.sin(a)}
              x2={C + (R + 20) * Math.cos(a)}
              y2={C + (R + 20) * Math.sin(a)}
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-border"
            />
          );
        })}
        <circle cx={C} cy={C} r={R} fill="none" strokeWidth="16" className="stroke-muted" />
        {value !== null && (
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.max(angle, 4) / 360)}
            transform={`rotate(-90 ${C} ${C})`}
            className="stroke-brand"
          />
        )}
        <circle cx={knob.x} cy={knob.y} r="15" className="fill-card stroke-brand" strokeWidth="5" />
        <text x={C} y={C - 4} textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-display text-[26px]">
          {value === null ? "—" : value < 60 ? value : formatDuration(value).replace(" min", "m").replace(/ hours?/, "h").replace(" h ", "h ")}
        </text>
        <text x={C} y={C + 24} textAnchor="middle" className="fill-muted-foreground text-[12px]">
          {value === null ? "drag to set" : value < 60 ? "minutes" : ""}
        </text>
      </svg>
      {value !== null && (
        <button type="button" onClick={() => onChange(null)} className="text-sm text-muted-foreground underline underline-offset-4">
          Clear
        </button>
      )}
    </div>
  );
}
