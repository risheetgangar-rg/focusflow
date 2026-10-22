// Unstuck service worker.
//
// It does three small things: show reminders (push), open the app when one is
// tapped, and keep the app from showing a browser error page when offline.
// It deliberately never caches pages or API responses: those hold one
// person's private tasks and must not outlive their sign-in.

const CACHE_NAME = "unstuck-static-v3";
const PRECACHE = ["/offline", "/icon.svg", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {
        // Offline page is a nicety; installing must not fail without it.
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Pages: always the network; only when it's unreachable, the friendly offline page.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  // Fingerprinted build assets never change, so they're safe to serve from cache.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});

// ---- "Next up": the task you should do next, kept in the notification bar ----
// Looks like a task row in the app (title, then when it's due), with a ✓ to
// tick it off right there. Ticking it moves the same notification on to the
// next task. (Phones that don't support buttons, like iPhones, open the app.)

const NEXT_TAG = "unstuck-next";
const TIMER_TAG = "unstuck-timer";

function showNextUp(next, note) {
  if (!next) {
    return self.registration.showNotification(note || "You're clear for now", {
      tag: NEXT_TAG,
      body: "Nothing waiting. Enjoy it.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      silent: true,
      data: { url: "/today" },
    });
  }
  const when = next.when ? next.when : next.kind === "reminder" ? "Reminder" : "Whenever";
  return self.registration.showNotification(next.title, {
    tag: NEXT_TAG,
    body: note ? `${note}\nNext up · ${when}` : `Next up · ${when}`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    renotify: Boolean(note),
    silent: !note,
    requireInteraction: true,
    actions: [
      { action: "done", title: "✓ Done" },
      { action: "open", title: next.kind === "reminder" ? "Open" : "Lock in" },
    ],
    data: { url: next.kind === "reminder" ? "/tasks" : `/today?focus=${next.id}`, taskId: next.id },
  });
}

async function tickOff(taskId) {
  const res = await fetch("/api/tasks/done", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId }),
  });
  if (!res.ok) throw new Error("not saved");
  const { win } = await res.json();
  const medal = win.newMedals?.[0];
  const note = medal ? `🏅 New medal: ${medal.name}! +${win.xpGained} XP` : `✓ Done! +${win.xpGained} XP. ${win.cheer}`;
  // Tell any open copy of the app, so its screen updates too.
  const windows = await self.clients.matchAll({ type: "window" });
  windows.forEach((client) => client.postMessage({ type: "unstuck:refresh" }));
  return showNextUp(win.next, note);
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "unstuck:next-up") event.waitUntil(showNextUp(event.data.next));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Unstuck", body: event.data.text() };
  }

  const options = {
    body: payload.body || "",
    tag: payload.tag || undefined,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/today", taskId: payload.taskId || null },
  };
  // Reminders about one task get the same ✓ as the "next up" card.
  if (payload.taskId) options.actions = [{ action: "done", title: "✓ Done" }, { action: "open", title: "Open" }];
  event.waitUntil(self.registration.showNotification(payload.title || "Unstuck", options));
});

self.addEventListener("notificationclick", (event) => {
  const { action } = event;
  const data = event.notification.data || {};

  // ✓ Done: tick it off here, no need to open the app.
  if (action === "done" && data.taskId) {
    event.notification.close();
    event.waitUntil(tickOff(data.taskId).catch(() => showNextUp({ id: data.taskId, title: event.notification.title, when: "Couldn't save. Tap to open.", kind: "task" })));
    return;
  }

  // The Lock-in timer's buttons belong to the open app, which runs the timer.
  if (event.notification.tag === TIMER_TAG && (action === "timer-done" || action === "timer-stop")) {
    event.notification.close();
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((windows) => {
        windows.forEach((client) => client.postMessage({ type: "unstuck:timer", action }));
        return windows[0]?.focus();
      }),
    );
    return;
  }

  event.notification.close();

  // The app reads `from=notification` once, records that the reminder worked, then tidies the URL.
  const target = new URL(data.url || "/today", self.location.origin);
  target.searchParams.set("from", "notification");

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === target.origin && "focus" in client) {
          client.navigate?.(target.href);
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target.href) : undefined;
    }),
  );
});
