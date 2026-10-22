"use client";

import Link from "next/link";
import { Flame, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/layout/logo-mark";
import { NAV_GROUPS, SETTINGS_ITEM } from "@/components/layout/nav-items";
import { Avatar } from "@/components/layout/user-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { levelProgress } from "@/lib/gamification/rules";
import type { GamificationMode } from "@/types/user";

/** Compact header for phones/tablets: wordmark, level chip, and a menu for everything not in the bottom bar. */
export function MobileTopBar({
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
  const name = displayName || (isGuest ? "Guest" : (email?.split("@")[0] ?? "You"));
  const level = levelProgress(xp).level;
  const extras = [
    ...NAV_GROUPS.flatMap((g) => g.items).filter((i) => !["/today", "/tasks", "/habits", "/review"].includes(i.href)),
    SETTINGS_ITEM,
  ].filter((i) => !(i.gameOnly && mode === "off"));

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-5 py-3 backdrop-blur-xl lg:hidden">
      <Link href="/today" aria-label="Unstuck home">
        <Wordmark />
      </Link>
      <div className="flex items-center gap-3">
        {mode !== "off" && (
          <Link
            href="/rewards"
            className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"
          >
            Lv {level}
            {momentum > 1 && (
              <span className="flex items-center gap-0.5">
                <Flame size={12} /> {momentum}
              </span>
            )}
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<button type="button" aria-label="Menu" className="rounded-full" />}>
            <Avatar name={name} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {extras.map((item) => (
              <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                <item.icon /> {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
