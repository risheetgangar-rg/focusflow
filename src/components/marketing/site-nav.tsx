import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoLink } from "./logo";

const SECTION_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
] as const;

/**
 * Sticky, translucent top bar. The section links are plain anchors so the
 * browser's own smooth scrolling (set on <html>) does the work with no JS.
 * On phones it shrinks to the logo and one button; "Log in" still lives in the hero and footer.
 */
export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:px-8">
        <LogoLink className="col-start-1" />

        <nav aria-label="Sections" className="col-start-2 hidden items-center justify-center gap-1 md:flex">
          {SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="col-start-3 flex items-center gap-1.5">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
