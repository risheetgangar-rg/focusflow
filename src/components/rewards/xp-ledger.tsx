import { cn } from "@/lib/utils";
import type { XpLedgerEntry } from "@/repositories/gamification-repository";
import { relativeDay } from "./format";
import { xpEventMeta } from "./xp-labels";

/** The latest things that earned XP, in plain words with a friendly date. */
export function XpLedger({
  entries,
  today,
  timezone,
}: {
  entries: XpLedgerEntry[];
  today: string;
  timezone: string;
}) {
  return (
    <section
      aria-labelledby="ledger-heading"
      className="rounded-[2rem] border border-border/80 bg-card p-6 shadow-soft sm:p-8"
    >
      <h2 id="ledger-heading" className="font-display text-3xl">
        Recent XP
      </h2>

      {entries.length === 0 ? (
        <p className="mt-3 text-muted-foreground">Nothing yet. Finish one small thing and it shows up here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border/70">
          {entries.map((entry) => {
            const { label, icon: Icon, tint } = xpEventMeta(entry.eventType);
            return (
              <li key={entry.id} className="flex items-center gap-4 py-3.5">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", tint)}>
                  <Icon className="size-[1.1rem]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {relativeDay(entry.createdAt, today, timezone)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">+{entry.xpAmount} XP</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
