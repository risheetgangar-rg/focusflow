"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { clearNextUp, nextUpEnabled, setNextUpEnabled, showNextUp } from "@/lib/notifications/local";

/** Per phone: keep the next task pinned in the notification bar, with its ✓. */
export function NextUpSetting() {
  const [on, setOn] = useState(nextUpEnabled);
  return (
    <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-card/70 px-4 py-3.5">
      <span className="min-w-0">
        <span className="block text-sm font-medium">Show my next task in the notification bar</span>
        <span className="block text-xs text-muted-foreground">With a ✓ to tick it off without opening the app.</span>
      </span>
      <Checkbox
        checked={on}
        onCheckedChange={(checked) => {
          const value = checked === true;
          setOn(value);
          setNextUpEnabled(value);
          void (value ? showNextUp() : clearNextUp());
        }}
      />
    </label>
  );
}
