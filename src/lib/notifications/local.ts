"use client";

import type { NextUp } from "@/services/win-service";

/*
 * Notifications the app shows itself (no server push needed): the "next up"
 * card with its ✓, and the Lock-in timer. Both live in the phone's
 * notification bar and quietly do nothing where notifications are off.
 */

const NEXT_UP_PREF = "unstuck-next-up";
const TIMER_TAG = "unstuck-timer";

export function nextUpEnabled(): boolean {
  try {
    return localStorage.getItem(NEXT_UP_PREF) !== "off";
  } catch {
    return true;
  }
}

export function setNextUpEnabled(on: boolean) {
  try {
    localStorage.setItem(NEXT_UP_PREF, on ? "on" : "off");
  } catch {
    // Storage blocked: it just stays on.
  }
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

/**
 * Put (or replace) the "next up" card in the notification bar, and close any
 * notification about a task that has since been deleted or finished.
 */
export async function showNextUp(next?: NextUp | null) {
  const reg = await registration();
  if (!reg?.active) return;
  let value = next;
  if (value === undefined) {
    const data = (await fetch("/api/tasks/next")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)) as { next: NextUp | null; openIds: string[] } | null;
    if (!data) return;
    value = data.next;
    const open = new Set(data.openIds);
    for (const n of await reg.getNotifications()) {
      const taskId = (n.data as { taskId?: string } | null)?.taskId;
      if (taskId && !open.has(taskId)) n.close();
    }
  }
  if (nextUpEnabled()) reg.active.postMessage({ type: "unstuck:next-up", next: value });
}

/** A task was deleted or finished here: take its notifications away right now. */
export async function clearTaskNotifications(taskId: string) {
  const reg = await registration();
  for (const n of (await reg?.getNotifications()) ?? []) {
    if ((n.data as { taskId?: string } | null)?.taskId === taskId) n.close();
  }
}

export async function clearNextUp() {
  const reg = await registration();
  (await reg?.getNotifications({ tag: "unstuck-next" }))?.forEach((n) => n.close());
}

function clockTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * The Lock-in timer in the notification bar. Phones don't let a web app run a
 * ticking clock there, so it shows minutes left and the finish time, updated
 * every half minute while the timer runs.
 */
export async function showTimer(title: string, remainingMs: number | null, elapsedMs: number, timesUp = false) {
  const reg = await registration();
  if (!reg) return;
  // The finish time never goes stale, even if the phone pauses the app; the
  // server also sends "Time's up!" at that minute, screen off or not.
  const startedAt = Date.now() - elapsedMs;
  const heading = timesUp
    ? "⏰ Time's up!"
    : remainingMs === null
      ? `🔒 Locked in since ${clockTime(startedAt)}`
      : `🔒 Locked in until ${clockTime(Date.now() + remainingMs)}`;
  const body = timesUp ? `“${title}” · Tap ✓ Done if you finished, or keep going.` : `“${title}” · Tap ✓ Done when you finish.`;
  await reg.showNotification(heading, {
    tag: TIMER_TAG,
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    silent: !timesUp,
    requireInteraction: true,
    // `renotify` and `actions` are supported on phones but missing from TypeScript's types.
    ...({ renotify: timesUp, actions: [{ action: "timer-done", title: "✓ Done" }, { action: "timer-stop", title: "Stop" }] } as object),
    data: { url: "/today" },
  });
}

export async function clearTimer() {
  const reg = await registration();
  (await reg?.getNotifications({ tag: TIMER_TAG }))?.forEach((n) => n.close());
}

/** Tell the notification bar the list changed (deleted, moved, snoozed), so it refreshes. */
export function announceTasksChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("unstuck:tasks-changed"));
}
