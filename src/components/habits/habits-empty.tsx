import { Sprout } from "lucide-react";
import { Companion } from "@/components/gamification/companion";
import { NewHabitButton } from "./new-habit-button";

/** Shown when there are no habits yet: one gentle prompt, one button. */
export function HabitsEmpty({ showCompanion }: { showCompanion: boolean }) {
  return (
    <section className="grid place-items-center rounded-[2rem] border border-border/80 bg-card px-6 py-14 text-center shadow-soft sm:py-20">
      {showCompanion ? (
        <Companion stage={1} mood="sleepy" size={128} />
      ) : (
        <span className="grid size-24 place-items-center rounded-full bg-tint-mint">
          <Sprout size={36} aria-hidden />
        </span>
      )}
      <h2 className="mt-6 font-display text-3xl sm:text-4xl">Add one habit you&apos;d like to keep.</h2>
      <p className="mt-3 max-w-sm text-muted-foreground">
        Start small. Something that takes a couple of minutes counts.
      </p>
      <div className="mt-8">
        <NewHabitButton variant="brand" size="xl" />
      </div>
    </section>
  );
}
