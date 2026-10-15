"use client";

import { useEffect, useRef } from "react";
import { trackClientEventAction } from "@/app/(dashboard)/today/actions";

/** Records that the rescue screen was opened (once per visit). Renders nothing. */
export function RescueOpenedTracker() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void trackClientEventAction("rescue_opened");
  }, []);

  return null;
}
