import { LifeBuoy, Target, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RevealGroup, RevealItem } from "./motion-bits";
import { SectionHeading } from "./section-heading";
import { FocusVisual, WhatsNextVisual } from "./visuals-flow";
import { RescueVisual } from "./visuals-care";

interface TileProps {
  tint: string;
  span: string;
  eyebrow: string;
  icon: LucideIcon;
  title: React.ReactNode;
  body: string;
  visual: React.ReactNode;
}

function Tile({ tint, span, eyebrow, icon: Icon, title, body, visual }: TileProps) {
  return (
    <RevealItem className={cn("flex", span)}>
      <article className={cn("flex w-full flex-col overflow-hidden rounded-[2rem] p-7 sm:p-9", tint)}>
        <header>
          <p className="inline-flex items-center gap-2 rounded-full bg-card/70 py-1 pr-3 pl-2.5 text-xs font-medium text-foreground/75">
            <Icon aria-hidden className="size-3.5" />
            {eyebrow}
          </p>
          <h3 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl">{title}</h3>
          <p className="mt-3 max-w-sm leading-relaxed text-foreground/70">{body}</p>
        </header>
        <div className="@container mt-auto pt-9">{visual}</div>
      </article>
    </RevealItem>
  );
}

const TILES: TileProps[] = [
  {
    tint: "bg-tint-peach",
    span: "md:col-span-3 lg:col-span-5",
    eyebrow: "Decide",
    icon: Target,
    title: <>What&apos;s next</>,
    body: "One clear task at a time, picked by what's due, what matters and how big it feels. Always with a reason.",
    visual: <WhatsNextVisual />,
  },
  {
    tint: "bg-tint-sky",
    span: "md:col-span-3 lg:col-span-7",
    eyebrow: "Do",
    icon: Timer,
    title: "Lock in",
    body: "Tap Lock in and the card becomes a calm timer, right there on Today. One step, nothing else competing for your attention.",
    visual: <FocusVisual />,
  },
  {
    tint: "bg-tint-rose",
    span: "md:col-span-6 lg:col-span-12",
    eyebrow: "Come back",
    icon: LifeBuoy,
    title: "The comeback",
    body: "Been away a few days? You see one tiny win, not a wall of old tasks. Move your plan forward in one tap, and undo it if you change your mind.",
    visual: <RescueVisual />,
  },
];

export function FeatureBento() {
  return (
    <section id="features" className="scroll-mt-16 pb-24 sm:pb-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything you need. <em>Nothing you don&apos;t.</em>
            </>
          }
          intro="Each piece is small on purpose, and each one is there to make starting a little easier."
        />

        <RevealGroup className="mt-14 grid gap-4 sm:mt-16 sm:gap-5 md:grid-cols-6 lg:grid-cols-12" step={0.09}>
          {TILES.map((tile) => (
            <Tile key={tile.eyebrow} {...tile} />
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
