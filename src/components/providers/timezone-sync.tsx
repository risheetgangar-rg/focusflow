"use client";

import { useEffect } from "react";
import { syncTimezoneAction } from "@/app/(dashboard)/settings/actions";

/** Brand-new accounts start on UTC; quietly adopt the browser's timezone once so "today" is the right day. */
export function TimezoneSync({ profileTimezone }: { profileTimezone: string }) {
  useEffect(() => {
    if (profileTimezone !== "UTC") return;
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browser && browser !== "UTC") void syncTimezoneAction(browser);
  }, [profileTimezone]);
  return null;
}
