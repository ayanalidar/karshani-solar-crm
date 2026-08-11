// Karshani Solar CRM — Service Worker
// Caches the app shell (HTML, JS, CSS, fonts, logo) so the app loads
// instantly on repeat visits and works offline for the shell. Data
// still requires a network connection (Supabase).

const CACHE_VERSION = "karshani-crm-v1";
const APP_SHELL = [
  "/",
  "/login",
  "/manifest.json",
  "/logo.jpeg",
  "/_next/static/chunks/main-app.js",
];

// Install — pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Use addAll with fallback — some Next.js chunk paths may not exist
      // at install time, so we cache what we can and skip failures.
      return Promise.allSettled(
        APP_SHELL.map((url) =>
          fetch(url)
            .then((res) => (res.ok ? cache.put(url, res.clone()) : null))
            .catch(() => null)
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first for navigation/HTML (so updates are picked up),
// cache-first for static assets (JS/CSS/images/fonts).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Don't intercept API calls or Supabase realtime — always hit network
  if (url.pathname.startsWith("/api/") || url.hostname.endsWith(".supabase.co")) {
    return;
  }

  // Navigation requests (HTML pages) — network-first, fall back to cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/")))
    );
    return;
  }

  // Static assets — cache-first
  if (req.destination === "script" || req.destination === "style" || req.destination === "image" || req.destination === "font") {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
