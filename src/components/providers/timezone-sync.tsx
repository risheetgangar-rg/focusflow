"use client";

import { useEffect } from "react";
import { syncTimezoneAction } from "@/app/(dashboard)/settings/actions";

/**
 * The timezone is never asked for: it comes from the phone, which already sets
 * it from where you are. Whenever the two differ, the profile quietly follows.
 */
export function TimezoneSync({ profileTimezone }: { profileTimezone: string }) {
  useEffect(() => {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (device && device !== profileTimezone) void syncTimezoneAction(device);
  }, [profileTimezone]);
  return null;
}
