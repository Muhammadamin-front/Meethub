/* MeetHub service worker — PWA installability + offline support.
 * Bump CACHE_VERSION whenever this file changes to evict old caches. */
const CACHE_VERSION = "meethub-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const OFFLINE_URL = "/offline.html";

// Precached on install so the offline page + app icons are always available.
const PRECACHE_URLS = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE_URLS)),
  );
  // Activate the new SW immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Cap a cache's entry count so images don't grow unbounded (rough LRU).
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)),
  );
}

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
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Images (optimized loader, static assets, icons): stale-while-revalidate —
  // serve the cached copy instantly, but always refetch in the background so a
  // changed/previously-failed image (e.g. a 404 cached before the asset
  // existed) self-heals on the next load. Only OK responses are cached.
  const isImage =
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/assets/") ||
    /\.(png|jpe?g|webp|avif|gif|svg)$/.test(url.pathname);
  if (isImage) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(IMAGE_CACHE).then((c) => {
                c.put(request, copy);
                trimCache(IMAGE_CACHE, 60);
              });
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Page navigations: network-first so content stays fresh, fall back to the
  // last cached version of this page, then the branded offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        }),
    );
  }
});
