import { MEDALS, type Progress } from "@/lib/rewards/medals";
import { MedalBadge } from "./medal-badge";

/** Level, XP and every medal: earned ones in colour, the rest as outlines to aim for. */
export function MedalCase({ progress }: { progress: Progress }) {
  const { level, xp, earned } = progress;
  return (
    <section aria-labelledby="medals" className="space-y-6">
      <div className="rounded-3xl border-2 border-border bg-card p-5 shadow-soft">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-3xl">Level {level.level}</p>
          <p className="text-sm text-muted-foreground">{xp} XP</p>
        </div>
        <p className="text-sm text-muted-foreground">{level.title}</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(level.fraction * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {level.xpForNextLevel - level.xpIntoLevel} XP to Level {level.level + 1}
        </p>
      </div>

      <div>
        <h2 id="medals" className="font-display text-3xl">
          Medals
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Once you earn one, it&apos;s yours for good.</p>
        <ul className="mt-5 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5">
          {MEDALS.map((m) => {
            const has = earned.includes(m.code);
            return (
              <li key={m.code} className="flex flex-col items-center text-center">
                <MedalBadge icon={m.icon} color={m.color} earned={has} />
                <p className={has ? "mt-2 text-sm font-semibold" : "mt-2 text-sm font-semibold text-muted-foreground"}>{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.how}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
