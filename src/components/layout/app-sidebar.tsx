"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { LevelCard } from "@/components/gamification/level-card";
import { Wordmark } from "@/components/layout/logo-mark";
import { NAV_GROUPS, SETTINGS_ITEM, isActivePath, type NavItem } from "@/components/layout/nav-items";
import { useQuickAdd } from "@/components/layout/quick-add-provider";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GamificationMode } from "@/types/user";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  if (item.comingSoon) {
    return (
      <span
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/40"
      >
        <Icon size={18} />
        {item.label}
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-white/60">Coming soon</span>
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-white text-indigo shadow-soft"
          : "text-white/80 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon
        size={18}
        className={cn("transition-colors", active ? "text-royal" : "text-white/60 group-hover:text-white")}
      />
      {item.label}
    </Link>
  );
}

export function AppSidebar({
  displayName,
  email,
  isGuest,
  mode,
  xp,
  momentum,
}: {
  displayName: string | null;
  email: string | null;
  isGuest: boolean;
  mode: GamificationMode;
  xp: number;
  momentum: number;
}) {
  const pathname = usePathname();
  const { openCapture } = useQuickAdd();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col border-r border-sidebar-border bg-brand-gradient text-sidebar-foreground lg:flex">
      <div className="px-6 pt-7 pb-5">
        <Link href="/today" aria-label="Unstuck home">
          <Wordmark />
        </Link>
      </div>

      <div className="px-4">
        <Button size="lg" onClick={openCapture} className="w-full justify-between bg-sunny pr-4 pl-5 text-indigo [--btn-shade:#c9a92c] hover:brightness-105">
          <span className="flex items-center gap-2">
            <Plus /> Add something
          </span>
          <kbd className="rounded-md bg-indigo/10 px-1.5 py-0.5 font-mono text-[0.7rem]">/</kbd>
        </Button>
      </div>

      <nav aria-label="Main" className="mt-6 flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !(item.gameOnly && mode === "off"));
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="text-eyebrow mb-1.5 px-3 text-white/55">{group.title}</p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="space-y-2 pb-3">
        <LevelCard xp={xp} momentum={momentum} mode={mode} />
        <div className="px-3">
          <NavLink item={SETTINGS_ITEM} active={isActivePath(pathname, SETTINGS_ITEM.href)} />
        </div>
        <div className="mx-3 border-t border-sidebar-border pt-2">
          <UserMenu displayName={displayName} email={email} isGuest={isGuest} />
        </div>
      </div>
    </aside>
  );
}
