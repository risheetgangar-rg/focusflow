export type GamificationMode = "off" | "light" | "full";

export interface Profile {
  id: string;
  displayName: string | null;
  timezone: string;
  gamificationMode: GamificationMode;
  createdAt: string;
  updatedAt: string;
}
