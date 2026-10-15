"use client";

import { createContext, useContext } from "react";
import type { GamificationMode } from "@/types/user";

export interface AppContextValue {
  timezone: string;
  mode: GamificationMode;
  displayName: string | null;
}

const AppContext = createContext<AppContextValue>({
  timezone: "UTC",
  mode: "light",
  displayName: null,
});

export function AppContextProvider({
  value,
  children,
}: {
  value: AppContextValue;
  children: React.ReactNode;
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** The signed-in person's timezone, game mode, and name, for any client component. */
export function useApp(): AppContextValue {
  return useContext(AppContext);
}
