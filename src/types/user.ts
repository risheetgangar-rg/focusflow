export type GamificationMode = "off" | "light" | "full";

export type FocusArea = "remembering" | "starting" | "focus" | "habits" | "all";

export interface Profile {
  id: string;
  displayName: string | null;
  timezone: string;
  gamificationMode: GamificationMode;
  theme: string;
  onboardingCompleted: boolean;
  focusAreas: string[];
  createdAt: string;
  updatedAt: string;
}
