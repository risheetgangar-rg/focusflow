"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand", className)}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** The person chip at the bottom of the sidebar. */
export function UserMenu({
  displayName,
  email,
  isGuest,
}: {
  displayName: string | null;
  email: string | null;
  isGuest: boolean;
}) {
  const name = displayName || (isGuest ? "Guest" : (email?.split("@")[0] ?? "You"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-sidebar-accent"
          />
        }
      >
        <Avatar name={name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-white/60">
            {isGuest ? "Guest · tap to keep your data" : email}
          </span>
        </span>
        <ChevronsUpDown size={16} className="shrink-0 text-white/60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
