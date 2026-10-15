// FocusFlow service worker.
//
// It does three small things: show reminders (push), open the app when one is
// tapped, and keep the app from showing a browser error page when offline.
// It deliberately never caches pages or API responses: those hold one
// person's private tasks and must not outlive their sign-in.

const CACHE_NAME = "focusflow-static-v2";
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

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "FocusFlow", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "FocusFlow", {
      body: payload.body || "",
      tag: payload.tag || undefined,
      data: { url: payload.url || "/today" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // The app reads `from=notification` once, records that the reminder worked, then tidies the URL.
  const target = new URL(event.notification.data?.url || "/today", self.location.origin);
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
