export interface GamificationState {
  xp: number;
  level: number;
  currentMomentum: number;
  longestMomentum: number;
  lastActivityAt: string | null;
}

export type XpEventType =
  | "task_started"
  | "task_completed"
  | "habit_completed"
  | "focus_completed"
  | "daily_quest_completed"
  | "side_quest_completed"
  | "rescue_action"
  | "boss_defeated"
  | "comeback";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  xpReward: number;
}

export type QuestType = "daily" | "side" | "boss" | "comeback";

export interface Quest {
  id: string;
  userId: string;
  type: QuestType;
  title: string;
  description: string | null;
  target: number;
  progress: number;
  xpReward: number;
  date: string;
  completed: boolean;
}

export interface RewardResult {
  xpAwarded: number;
  totalXp: number;
  leveledUp: boolean;
  newLevel: number;
  momentum: number;
  isComeback: boolean;
  unlockedAchievements: string[];
}

export interface OneMoreSuggestion {
  taskId: string;
  title: string;
  minutes: number;
}

/** What a completion hands back to the UI so it can celebrate (and only as much as the user's game mode allows). */
export interface CompletionOutcome {
  reward: RewardResult | null;
  oneMore: OneMoreSuggestion | null;
  bossDefeated: string | null;
  questCompleted: string | null;
}
