"use client";

import { useEffect } from "react";

/** Mirrors the profile's saved theme into localStorage + the <html> element (and back from settings changes). */
export function applyTheme(theme: string) {
  try {
    localStorage.setItem("ff-theme", theme);
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this page view.
  }
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "midnight");
}

export function ThemeSync({ theme }: { theme: string }) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}
