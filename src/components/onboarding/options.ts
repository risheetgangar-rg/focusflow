import type { GamificationMode } from "@/types/user";

/** The four things people can ask for help with. "All of these" is derived from having all four. */
export type FocusAreaId = "remembering" | "starting" | "focus" | "habits";

export interface FocusAreaOption {
  id: FocusAreaId;
  title: string;
  description: string;
  /** Pastel tile behind the icon. */
  tint: string;
}

export const FOCUS_AREAS: FocusAreaOption[] = [
  {
    id: "remembering",
    title: "Remembering",
    description: "Things slip through the cracks.",
    tint: "bg-tint-lavender",
  },
  {
    id: "starting",
    title: "Starting",
    description: "Getting going on things that feel big.",
    tint: "bg-tint-peach",
  },
  {
    id: "focus",
    title: "Staying focused",
    description: "Keeping on track once I've begun.",
    tint: "bg-tint-sky",
  },
  {
    id: "habits",
    title: "Building habits",
    description: "Doing the small things, regularly.",
    tint: "bg-tint-mint",
  },
];

export const ALL_FOCUS_AREAS: FocusAreaId[] = FOCUS_AREAS.map((area) => area.id);

/** What's saved on the profile: the chosen areas, plus "all" when every one is picked. */
export function toFocusAreaValues(selected: FocusAreaId[]): string[] {
  const all = ALL_FOCUS_AREAS.every((id) => selected.includes(id));
  return all ? [...ALL_FOCUS_AREAS, "all"] : [...selected];
}

export const GAME_MODES: { value: GamificationMode; label: string; description: string }[] = [
  { value: "off", label: "Off", description: "No game layer. Just your tasks, nice and quiet." },
  { value: "light", label: "Light", description: "XP, levels and momentum, so progress is easy to see." },
  { value: "full", label: "Full", description: "Everything in Light, plus quests, achievements, a companion and themes." },
];
