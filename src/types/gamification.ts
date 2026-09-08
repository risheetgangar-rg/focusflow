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
