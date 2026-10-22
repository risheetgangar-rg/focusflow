"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Plus, Settings, Sparkles, Sun } from "lucide-react";
import { isActivePath } from "@/components/layout/nav-items";
import { useQuickAdd } from "@/components/layout/quick-add-provider";
import { cn } from "@/lib/utils";

const LEFT = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
];
const RIGHT = [
  { href: "/review", label: "Ta-Da", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Tab({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Sun; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-brand-soft text-brand")}>
        <Icon size={20} />
      </span>
      {label}
    </Link>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { openCapture } = useQuickAdd();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end">
        {LEFT.map((item) => (
          <Tab key={item.href} {...item} active={isActivePath(pathname, item.href)} />
        ))}
        <div className="flex flex-1 justify-center pb-2">
          <button
            type="button"
            onClick={openCapture}
            aria-label="Add something"
            className="-mt-5 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform active:scale-95"
          >
            <Plus size={26} />
          </button>
        </div>
        {RIGHT.map((item) => (
          <Tab key={item.href} {...item} active={isActivePath(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}
