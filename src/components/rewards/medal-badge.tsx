import {
  BellRing,
  Crown,
  Footprints,
  Lock,
  Medal as MedalIcon,
  Moon,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Sunrise,
  Swords,
  Trophy,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { MedalColor } from "@/lib/rewards/medals";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  BellRing,
  Crown,
  Footprints,
  Lock,
  Medal: MedalIcon,
  Moon,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Sunrise,
  Swords,
  Trophy,
  Waves,
  Zap,
};

/* Two-tone metal looks, like an awards case: a bright face and a darker rim. */
const COLORS: Record<MedalColor, string> = {
  gold: "from-[#ffe066] to-[#f5a623] [--rim:#c77d0a]",
  lime: "from-[#e6f05a] to-[#8cc63f] [--rim:#5e8f1f]",
  sky: "from-[#9cc0ff] to-[#1446c8] [--rim:#0b2c86]",
  rose: "from-[#ffb3c7] to-[#e5487a] [--rim:#a8264f]",
  violet: "from-[#c3b5ff] to-[#5b3fd6] [--rim:#33208f]",
  peach: "from-[#ffd3a8] to-[#ff8a3d] [--rim:#c45a12]",
};

/** One round medal. Locked medals are a plain grey outline so they read as "to aim for". */
export function MedalBadge({
  icon,
  color,
  earned = true,
  size = "md",
}: {
  icon: string;
  color: MedalColor;
  earned?: boolean;
  size?: "md" | "lg";
}) {
  const Icon = ICONS[icon] ?? MedalIcon;
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full",
        size === "lg" ? "size-36" : "size-16",
        earned
          ? cn("bg-gradient-to-br text-white shadow-[0_5px_0_var(--rim)]", COLORS[color])
          : "border-2 border-dashed border-border bg-muted text-muted-foreground/60",
      )}
    >
      {earned && <span className="absolute inset-[12%] rounded-full border-2 border-white/40" aria-hidden />}
      <Icon className={size === "lg" ? "size-16" : "size-7"} strokeWidth={2.25} />
    </span>
  );
}
