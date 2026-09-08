import type { RewardResult } from "@/services/gamification-service";

export function RewardFeedback({ reward }: { reward: RewardResult | null }) {
  if (!reward) return null;

  return (
    <div className="text-sm text-green-700 dark:text-green-500">
      +{reward.xpAwarded} XP
      {reward.momentum > 1 && <span> · 🔥 Momentum +{reward.momentum}</span>}
      {reward.leveledUp && <span> · Level up! Lv {reward.newLevel}</span>}
      {reward.isComeback && <span> · Welcome back</span>}
      {reward.unlockedAchievements.map((name) => (
        <span key={name}> · 🏆 {name}</span>
      ))}
    </div>
  );
}
