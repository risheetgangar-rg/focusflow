"use client";

import { useEffect } from "react";
import { trackClientEventAction, trackSessionOpenedAction } from "@/app/(dashboard)/today/actions";

const SESSION_KEY = "ff-session";

/**
 * Quiet bookkeeping on Today: one "opened the app" event per browser session
 * (the denominator for the unstuck rate), and a note when someone arrived by
 * tapping a reminder.
 */
export function SessionPing() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") === "notification") {
      void trackClientEventAction("notification_opened");
      params.delete("from");
      const rest = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""));
    }

    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      return; // storage unavailable: skip rather than count every navigation
    }
    void trackSessionOpenedAction();
  }, []);

  return null;
}
