import Link from "next/link";
import { LogoLink } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-6 sm:mt-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <LogoLink />
        <nav aria-label="Footer" className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="transition-colors hover:text-foreground">
            Log in
          </Link>
          <Link href="/signup" className="transition-colors hover:text-foreground">
            Sign up
          </Link>
        </nav>
        <p className="text-sm text-muted-foreground">Made with care for busy brains.</p>
      </div>
    </footer>
  );
}
