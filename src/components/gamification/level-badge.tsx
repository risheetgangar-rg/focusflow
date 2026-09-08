import { levelProgress } from "@/services/gamification-service";

export function LevelBadge({ xp, momentum }: { xp: number; momentum: number }) {
  const progress = levelProgress(xp);
  const pct = progress.xpForNextLevel > 0 ? (progress.xpIntoLevel / progress.xpForNextLevel) * 100 : 100;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="text-right">
        <p className="font-medium">
          Lv {progress.level} · {progress.title}
        </p>
        <div className="bg-muted h-1.5 w-28 overflow-hidden rounded-full">
          <div className="bg-primary h-full" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>
      {momentum > 1 && <span title="Momentum">🔥 {momentum}</span>}
    </div>
  );
}
