/* SPORTSLINK offline navigation fallback. Keep this file dependency-free. */
const CACHE_NAME = "sportslink-offline-v1";
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_PAGE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("sportslink-offline-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === OFFLINE_PAGE) return;

  event.respondWith(
    fetch(request).then((response) => {
      // Use the branded offline state when the origin returns a server error.
      if (response.status >= 500) {
        return caches.match(OFFLINE_PAGE).then((fallback) => fallback || response);
      }
      return response;
    }).catch(() => caches.match(OFFLINE_PAGE))
  );
});
