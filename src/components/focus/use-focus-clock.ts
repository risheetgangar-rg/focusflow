import { useEffect, useState } from "react";

interface ClockState {
  /** Active time banked before the current stretch, in ms. */
  banked: number;
  /** When the current stretch began (epoch ms), or null while paused or not started. */
  since: number | null;
}

export interface FocusClock {
  /** Time spent focusing, paused time excluded. */
  elapsedMs: number;
  running: boolean;
  /** Begin from zero. */
  start: () => void;
  pause: () => void;
  resume: () => void;
}

const IDLE: ClockState = { banked: 0, since: null };

/**
 * A stopwatch that stays honest when the tab is hidden, the laptop sleeps, or
 * the browser throttles timers: elapsed time is always computed from
 * timestamps, never by counting ticks. The timer only decides when to
 * re-render (just after each whole second), not what the time is.
 */
export function useFocusClock(): FocusClock {
  const [clock, setClock] = useState<ClockState>(IDLE);
  // The last moment we rendered "now" for. Only ever written from timers and event handlers.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (clock.since === null) return;
    const { banked, since } = clock;

    let timer = 0;
    const arm = () => {
      const elapsed = banked + Math.max(0, Date.now() - since);
      timer = window.setTimeout(() => {
        setNow(Date.now());
        arm();
      }, 1000 - (elapsed % 1000) + 10);
    };
    // Coming back to a hidden tab shouldn't wait for the next scheduled tick.
    const refresh = () => setNow(Date.now());

    arm();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [clock]);

  const elapsedMs = clock.banked + (clock.since === null ? 0 : Math.max(0, now - clock.since));

  function start() {
    const t = Date.now();
    setNow(t);
    setClock({ banked: 0, since: t });
  }

  function pause() {
    const t = Date.now();
    setClock((c) => (c.since === null ? c : { banked: c.banked + Math.max(0, t - c.since), since: null }));
  }

  function resume() {
    const t = Date.now();
    setNow(t);
    setClock((c) => (c.since === null ? { banked: c.banked, since: t } : c));
  }

  return { elapsedMs, running: clock.since !== null, start, pause, resume };
}
