import {
  Brain,
  CalendarCheck,
  LifeBuoy,
  ListChecks,
  Mic,
  Repeat2,
  Settings,
  Sun,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden when the game layer is off. */
  gameOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Your day",
    items: [
      { href: "/today", label: "Today", icon: Sun },
      { href: "/tasks", label: "Tasks", icon: ListChecks },
      { href: "/habits", label: "Habits", icon: Repeat2 },
      { href: "/focus", label: "Focus", icon: Target },
    ],
  },
  {
    title: "Capture",
    items: [
      { href: "/brain-dump", label: "Brain dump", icon: Brain },
      { href: "/voice", label: "Voice", icon: Mic },
    ],
  },
  {
    title: "Reflect",
    items: [
      { href: "/review", label: "Review", icon: CalendarCheck },
      { href: "/rescue", label: "Rescue", icon: LifeBuoy },
      { href: "/rewards", label: "Rewards", icon: Trophy, gameOnly: true },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/settings", label: "Settings", icon: Settings };

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
