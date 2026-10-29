/* Deen service worker: offline shell, static asset cache and prayer reminders. */

const VERSION = "v1";
const STATIC_CACHE = `deen-static-${VERSION}`;
const PAGE_CACHE = "deen-pages"; // shared with the app, which warms it on load
const APP_ROUTES = ["/today", "/history", "/stats", "/settings"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => Promise.allSettled(APP_ROUTES.map((path) => cache.add(new Request(path, { credentials: "same-origin" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("deen-") && ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Hashed build assets never change: serve from cache first.
  if (url.pathname.startsWith("/_next/static/") || /\.(?:woff2?|png|svg|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Pages: network first, fall back to the last copy so the app opens offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(PAGE_CACHE);
          return (await cache.match(url.pathname)) ?? (await cache.match("/today")) ?? Response.error();
        }),
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Deen", body: event.data.text(), url: "/today" };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: payload.url ?? "/today" },
      actions: payload.actions ?? [],
      renotify: false,
    }),
  );
});

async function focusOrOpen(target) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windows) {
    if (new URL(client.url).origin === self.location.origin && "focus" in client) {
      await client.navigate(target).catch(() => {});
      return client.focus();
    }
  }
  return self.clients.openWindow(target);
}

/** Marks the prayer straight from the notification, without opening the app. */
async function markFromNotification(target) {
  const url = new URL(target, self.location.origin);
  const prayer = url.searchParams.get("mark");
  const date = url.searchParams.get("date");
  if (!prayer || !date) return focusOrOpen(target);
  const op = {
    kind: "log",
    date,
    prayer,
    at: Date.now(),
    data: { status: "ON_TIME", congregation: null, sunnahBefore: false, sunnahAfter: false, witr: false, combined: false, rakats: null },
  };
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ ops: [op] }),
    });
    if (!res.ok) throw new Error(String(res.status));
    // Let any open tab pick up the change.
    const windows = await self.clients.matchAll({ type: "window" });
    windows.forEach((client) => client.postMessage({ type: "deen:synced" }));
  } catch {
    return focusOrOpen(target);
  }
}

self.addEventListener("notificationclick", (event) => {
  const target = event.notification.data?.url ?? "/today";
  event.notification.close();
  if (event.action === "mark") {
    event.waitUntil(markFromNotification(target));
  } else {
    event.waitUntil(focusOrOpen(target.split("?")[0]));
  }
});
