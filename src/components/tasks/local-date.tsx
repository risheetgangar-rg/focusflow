"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Formats in the viewer's own locale/timezone; renders nothing on the server so hydration can't mismatch. */
export function LocalDate({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => new Date(iso).toLocaleDateString(),
    () => "",
  );
  return <>{text}</>;
}
