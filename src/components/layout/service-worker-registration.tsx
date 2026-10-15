"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (reminders + offline page) in production only.
 * In development it would serve stale files, so any worker left over from an
 * earlier run is removed instead.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((registration) => void registration.unregister()));
      return;
    }

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
      // The app works fine without it; reminders and the offline page just won't be available.
    });
  }, []);

  return null;
}
