import { levelProgress } from "@/lib/gamification/rules";
import { zonedHour } from "@/lib/dates/tz";

/*
 * XP and medals, in the spirit of fitness-ring awards and game achievements.
 * Everything is worked out from what the person actually DID, so nothing is
 * ever lost: no streaks, no "you missed", and a medal, once earned, stays.
 */

export interface DoneItem {
  id: string;
  completedAt: string;
  priority: string;
  kind: string;
  felt: string | null;
}

export interface FocusItem {
  id: string;
  minutes: number;
  completed: boolean;
}

export interface History {
  done: DoneItem[];
  focus: FocusItem[];
  /** Times they moved their plan forward after being away. */
  comebacks: number;
}

export type MedalColor = "gold" | "lime" | "sky" | "rose" | "violet" | "peach";

export interface Medal {
  code: string;
  name: string;
  /** How to earn it, shown on locked medals too. */
  how: string;
  /** Lucide icon name, mapped in the medal component. */
  icon: string;
  color: MedalColor;
  earned: (h: History, tz: string) => boolean;
}

const tasksDone = (h: History) => h.done.filter((d) => d.kind !== "reminder").length;
const focusMinutes = (h: History) => h.focus.reduce((sum, f) => sum + f.minutes, 0);

function doneOnSameDay(h: History, tz: string, count: number): boolean {
  const perDay = new Map<string, number>();
  for (const d of h.done) {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(d.completedAt));
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  return [...perDay.values()].some((n) => n >= count);
}

export const MEDALS: Medal[] = [
  { code: "first_step", name: "First Step", how: "Finish your first task", icon: "Footprints", color: "lime", earned: (h) => tasksDone(h) >= 1 },
  { code: "locked_in", name: "Locked In", how: "Finish a task with the timer on", icon: "Lock", color: "violet", earned: (h) => h.focus.some((f) => f.completed) },
  { code: "hat_trick", name: "Hat Trick", how: "Finish 3 things in one day", icon: "Sparkles", color: "gold", earned: (h, tz) => doneOnSameDay(h, tz, 3) },
  { code: "tiny_wins", name: "Tiny Wins", how: "Finish 5 tasks", icon: "Star", color: "sky", earned: (h) => tasksDone(h) >= 5 },
  { code: "deep_dive", name: "Deep Dive", how: "Lock in for 25 minutes at once", icon: "Waves", color: "sky", earned: (h) => h.focus.some((f) => f.minutes >= 25) },
  { code: "early_bird", name: "Early Bird", how: "Finish something before 9 am", icon: "Sunrise", color: "peach", earned: (h, tz) => h.done.some((d) => zonedHour(new Date(d.completedAt), tz) < 9 && zonedHour(new Date(d.completedAt), tz) >= 4) },
  { code: "night_owl", name: "Night Owl", how: "Finish something after 10 pm", icon: "Moon", color: "violet", earned: (h, tz) => h.done.some((d) => zonedHour(new Date(d.completedAt), tz) >= 22) },
  { code: "brave", name: "Brave One", how: "Finish a Critical task", icon: "Shield", color: "rose", earned: (h) => h.done.some((d) => d.priority === "critical") },
  { code: "dread_slayer", name: "Dread Slayer", how: "Find 3 tasks easier than you feared", icon: "Swords", color: "rose", earned: (h) => h.done.filter((d) => d.felt === "easier").length >= 3 },
  { code: "comeback_kid", name: "Comeback Kid", how: "Come back after time away and finish something", icon: "RotateCcw", color: "lime", earned: (h) => h.comebacks > 0 && tasksDone(h) >= 1 },
  { code: "on_it", name: "On It", how: "Tick off 5 reminders", icon: "BellRing", color: "peach", earned: (h) => h.done.filter((d) => d.kind === "reminder").length >= 5 },
  { code: "ten_down", name: "Ten Down", how: "Finish 10 tasks", icon: "Trophy", color: "gold", earned: (h) => tasksDone(h) >= 10 },
  { code: "hour_power", name: "Hour of Power", how: "Lock in for 60 minutes in total", icon: "Zap", color: "gold", earned: (h) => focusMinutes(h) >= 60 },
  { code: "fifty", name: "Half Century", how: "Finish 50 tasks", icon: "Medal", color: "sky", earned: (h) => tasksDone(h) >= 50 },
  { code: "hundred", name: "Unstoppable", how: "Finish 100 tasks", icon: "Crown", color: "gold", earned: (h) => tasksDone(h) >= 100 },
];

const XP_BY_PRIORITY: Record<string, number> = { low: 10, medium: 10, high: 15, critical: 25 };

/** XP for one finished item: harder things are worth more. */
export function xpForDone(d: Pick<DoneItem, "priority" | "kind">): number {
  return d.kind === "reminder" ? 5 : (XP_BY_PRIORITY[d.priority] ?? 10);
}

export function totalXp(h: History): number {
  return h.done.reduce((sum, d) => sum + xpForDone(d), 0) + focusMinutes(h);
}

export interface Progress {
  xp: number;
  level: ReturnType<typeof levelProgress>;
  earned: string[];
}

export function progressFor(h: History, tz: string): Progress {
  const xp = totalXp(h);
  return { xp, level: levelProgress(xp), earned: MEDALS.filter((m) => m.earned(h, tz)).map((m) => m.code) };
}

const CHEERS = [
  "Look at you go!",
  "That's one less thing in your head.",
  "Your brain said later. You said now.",
  "Done is better than perfect. And it's done.",
  "Future you says thanks.",
  "Small step, real win.",
  "You showed up. That's the hard part.",
];

/** A different happy line each time, picked from the task id so it's stable on re-render. */
export function cheerFor(id: string): string {
  let n = 0;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return CHEERS[n % CHEERS.length];
}
