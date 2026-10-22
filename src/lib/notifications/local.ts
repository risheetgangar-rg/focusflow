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

/** Put (or replace) the "next up" card in the notification bar. */
export async function showNextUp(next?: NextUp | null) {
  if (!nextUpEnabled()) return;
  const reg = await registration();
  if (!reg?.active) return;
  const value =
    next !== undefined ? next : ((await fetch("/api/tasks/next").then((r) => (r.ok ? r.json() : { next: null })).catch(() => ({ next: null }))) as { next: NextUp | null }).next;
  reg.active.postMessage({ type: "unstuck:next-up", next: value });
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
  const minutes = Math.max(0, Math.ceil((remainingMs ?? 0) / 60_000));
  const body = timesUp
    ? "Time's up! Tap Done if you finished, or keep going."
    : remainingMs === null
      ? `Locked in for ${Math.floor(elapsedMs / 60_000)} min`
      : `${minutes} min left · ends at ${clockTime(Date.now() + remainingMs)}`;
  await reg.showNotification(`🔒 ${title}`, {
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
