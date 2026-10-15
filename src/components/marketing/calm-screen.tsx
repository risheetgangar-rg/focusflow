import { cn } from "@/lib/utils";
import { Mascot } from "./mascot";
import { Rise } from "./rise";

type Tint = "lavender" | "peach" | "sky" | "mint" | "rose";
type Mood = "happy" | "cheer" | "sleepy";

const GLOW: Record<Tint, [string, string]> = {
  lavender: ["bg-tint-lavender", "bg-tint-peach"],
  peach: ["bg-tint-peach", "bg-tint-butter"],
  sky: ["bg-tint-sky", "bg-tint-lavender"],
  mint: ["bg-tint-mint", "bg-tint-sky"],
  rose: ["bg-tint-rose", "bg-tint-peach"],
};

/**
 * A centred, quiet full-page message with the companion: used for "page not found",
 * "something went wrong" and "you're offline". Everything here is server-rendered and
 * animated with CSS only, so it still looks right when scripts haven't loaded (or can't).
 */
export function CalmScreen({
  title,
  eyebrow,
  children,
  actions,
  mood = "sleepy",
  tint = "lavender",
}: {
  title: React.ReactNode;
  eyebrow?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  mood?: Mood;
  tint?: Tint;
}) {
  const [primary, secondary] = GLOW[tint];

  return (
    <main
      id="main"
      className="bg-grain relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className={cn("animate-float-slow absolute -top-40 -left-32 size-[30rem] rounded-full blur-3xl", primary)} />
        <div
          className={cn(
            "animate-float-slow absolute -right-32 -bottom-40 size-[28rem] rounded-full blur-3xl [animation-delay:-5s]",
            secondary,
          )}
        />
      </div>

      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        <Rise>
          <Mascot stage={2} mood={mood} size={140} />
        </Rise>
        {eyebrow ? (
          <Rise delay={0.08}>
            <p className="mt-6 text-eyebrow">{eyebrow}</p>
          </Rise>
        ) : null}
        <Rise delay={0.12}>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-[-0.03em] sm:text-7xl">{title}</h1>
        </Rise>
        <Rise delay={0.2}>
          <div className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">{children}</div>
        </Rise>
        {actions ? (
          <Rise delay={0.28} className="mt-9">
            <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>
          </Rise>
        ) : null}
      </div>
    </main>
  );
}
