export interface BossStatus {
  total: number;
  remaining: number;
  /** 0-100. A boss with no phases yet stays at full health. */
  hp: number;
  defeated: boolean;
}

/** Each completed subtask ("phase") takes a proportional bite out of the boss's HP. */
export function bossStatus(subtasks: { completed: boolean }[]): BossStatus {
  const total = subtasks.length;
  if (total === 0) return { total: 0, remaining: 0, hp: 100, defeated: false };

  const remaining = subtasks.filter((s) => !s.completed).length;
  return {
    total,
    remaining,
    hp: Math.round((remaining / total) * 100),
    defeated: remaining === 0,
  };
}
