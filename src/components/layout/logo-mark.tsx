import Image from "next/image";
import { cn } from "@/lib/utils";

/** App icon: the glowing "UN" from the Unstuck logo on its indigo square. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/icon-192.png"
      alt=""
      width={36}
      height={36}
      aria-hidden
      className={cn("size-9 shrink-0 rounded-[26%]", className)}
    />
  );
}

/**
 * The Unstuck wordmark, from the logo artwork. Its background was cut away so
 * it glows straight off the indigo header instead of sitting in a box. On a
 * white page pass `onLight` and it gets its own indigo badge.
 */
export function Wordmark({ className, onLight = false }: { className?: string; onLight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        onLight && "rounded-2xl bg-indigo px-3 py-1.5 shadow-[0_4px_0_#0f0066]",
        className,
      )}
    >
      <Image
        src="/logo-unstuck.png"
        alt="Unstuck"
        width={1664}
        height={719}
        priority
        className="h-10 w-auto select-none [filter:drop-shadow(0_0_10px_rgb(255_224_102/0.25))]"
      />
    </span>
  );
}
