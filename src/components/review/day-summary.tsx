import { CircleCheck, CircleDashed, CornerUpRight } from "lucide-react";
import { AnimatedNumber, Stagger, StaggerItem } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";

const TILES = [
  { key: "completed", label: "Done", note: "finished today", tint: "bg-tint-mint", icon: CircleCheck },
  { key: "moved", label: "Moved", note: "set for another day", tint: "bg-tint-peach", icon: CornerUpRight },
  { key: "open", label: "Still open", note: "waiting for you", tint: "bg-tint-sky", icon: CircleDashed },
] as const;

/** Three big, warm numbers: what got done, what moved, what's still open. */
export function DaySummary({ completed, moved, open }: { completed: number; moved: number; open: number }) {
  const values = { completed, moved, open };

  return (
    <Stagger className="grid grid-cols-3 gap-3 sm:gap-5" delay={0.1}>
      {TILES.map(({ key, label, note, tint, icon: Icon }) => (
        <StaggerItem key={key} className="h-full">
          <div className={cn("flex h-full flex-col justify-between rounded-[2rem] p-4 sm:p-8", tint)}>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Icon className="hidden size-4 sm:block" aria-hidden />
              {label}
            </p>
            <div className="mt-6 sm:mt-10">
              <p className="font-display text-6xl leading-none sm:text-7xl">
                <span aria-hidden>
                  <AnimatedNumber value={values[key]} />
                </span>
                <span className="sr-only">{values[key]}</span>
              </p>
              <p className="mt-2 hidden text-sm text-foreground/60 sm:block">{note}</p>
            </div>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
