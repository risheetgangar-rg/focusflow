import { Brain, ListChecks, Plug, Settings, Sparkles, Sun, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden when the game layer is off. */
  gameOnly?: boolean;
  /** Shown greyed out with "Coming soon", and can't be opened. */
  comingSoon?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/*
 * Kept deliberately short so nothing feels like a dashboard. Focus now lives
 * inside Today; Habits, Voice, Rescue and Rewards are hidden (not deleted).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Your day",
    items: [
      { href: "/today", label: "Today", icon: Sun },
      { href: "/tasks", label: "Tasks", icon: ListChecks },
    ],
  },
  {
    title: "Look back",
    items: [{ href: "/review", label: "Ta-Da List", icon: Sparkles }],
  },
  {
    title: "Capture",
    items: [{ href: "/brain-dump", label: "Brain dump", icon: Brain, comingSoon: true }],
  },
  {
    title: "Connect",
    items: [{ href: "/connections", label: "Workspace connections", icon: Plug, comingSoon: true }],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/settings", label: "Settings", icon: Settings };

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
