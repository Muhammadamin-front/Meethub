/* MeetHub service worker — minimal, safe caching for PWA installability + offline.
 * Bump CACHE_VERSION whenever this file changes to evict old caches. */
const CACHE_VERSION = "meethub-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

self.addEventListener("install", () => {
  // Activate the new SW immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GETs. Never touch APIs, auth, or webhooks so we
  // don't serve stale or private data.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Immutable, hashed build assets: cache-first (fast, offline-friendly).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Page navigations: network-first so content stays fresh, fall back to the
  // last cached version (then a bare offline message) when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response(
              "<!doctype html><meta charset=utf-8><title>Offline</title><body style='font-family:sans-serif;padding:2rem'>You are offline. Reconnect to use MeetHub.</body>",
              { headers: { "Content-Type": "text/html" } },
            )
          );
        }),
    );
  }
});
