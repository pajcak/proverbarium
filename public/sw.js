/*
 * Proverbarium service worker — offline-friendly app shell caching.
 * Network-first for navigations (fresh content when online),
 * cache-first for static assets (instant repeat loads, offline reading).
 */
const CACHE_NAME = "proverbarium-v1";
// Paths resolve against the registration scope so the app works under a
// sub-path (e.g. GitHub Pages: https://user.github.io/repo/).
const SCOPE = self.registration.scope;
const SHELL_URL = `${SCOPE}index.html`;
const APP_SHELL = [SCOPE, SHELL_URL, `${SCOPE}manifest.webmanifest`, `${SCOPE}icon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // SPA navigations: try the network, fall back to the cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_URL)),
    );
    return;
  }

  // Static assets: cache-first with background fill.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
