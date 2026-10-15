import {
  CircleCheck,
  Compass,
  Footprints,
  LifeBuoy,
  Repeat2,
  Sparkles,
  Sunrise,
  Swords,
  Target,
  Timer,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface XpEventMeta {
  label: string;
  icon: LucideIcon;
  /** A tint class such as "bg-tint-mint". */
  tint: string;
}

/** Friendly wording for every kind of XP event in the ledger. */
const XP_EVENTS: Record<string, XpEventMeta> = {
  task_completed: { label: "Finished a task", icon: CircleCheck, tint: "bg-tint-mint" },
  habit_completed: { label: "Kept up a habit", icon: Repeat2, tint: "bg-tint-lavender" },
  focus_completed: { label: "Finished a focus session", icon: Timer, tint: "bg-tint-sky" },
  boss_defeated: { label: "Defeated a boss task", icon: Swords, tint: "bg-tint-rose" },
  daily_quest_completed: { label: "Completed the daily quest", icon: Target, tint: "bg-tint-butter" },
  side_quest_completed: { label: "Completed a side quest", icon: Compass, tint: "bg-tint-peach" },
  rescue_action: { label: "Started getting back on track", icon: LifeBuoy, tint: "bg-tint-sky" },
  comeback: { label: "Welcome back", icon: Sunrise, tint: "bg-tint-peach" },
  task_started: { label: "Got started", icon: Footprints, tint: "bg-tint-mint" },
  achievement_unlocked: { label: "Achievement unlocked", icon: Trophy, tint: "bg-tint-butter" },
};

const FALLBACK: XpEventMeta = { label: "Earned some XP", icon: Sparkles, tint: "bg-tint-lavender" };

export function xpEventMeta(eventType: string): XpEventMeta {
  return XP_EVENTS[eventType] ?? FALLBACK;
}
