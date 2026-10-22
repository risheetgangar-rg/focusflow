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
  /** Last time they opened the app. */
  lastSeenAt: string | null;
  /** Start of the absence we are welcoming them back from; null when not in welcome-back mode. */
  awaySince: string | null;
  welcomeDismissedOn: string | null;
  createdAt: string;
  updatedAt: string;
}
