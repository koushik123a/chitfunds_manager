// ─────────────────────────────────────────────────────────────
//  Chit Manager — Service Worker
//  HOW TO UPDATE THE APP:
//  Change CACHE_NAME to a new version string (e.g. 'chit-v11')
//  every time you upload a new index.html. This forces all users
//  to get the fresh version on their next app open.
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'ratna-chits-v4';

const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── INSTALL ──────────────────────────────────────────────────
// Runs once when the service worker is first registered.
// Downloads all app files into the browser's Cache Storage.
// This is what makes the app work offline.
self.addEventListener('install', event => {
  console.log('[SW] Installing cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app files');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Don't wait for old tabs to close — activate immediately
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
// Runs after install. Cleans up any old caches from previous
// versions. This is the auto-update mechanism.
self.addEventListener('activate', event => {
  console.log('[SW] Activating:', CACHE_NAME);
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)  // find old caches
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);           // delete them
            })
        );
      })
      .then(() => {
        // Take control of all open tabs immediately
        return self.clients.claim();
      })
  );
});

// ── FETCH ─────────────────────────────────────────────────────
// Intercepts every network request the app makes.
// Strategy: Cache First — serve from cache, fall back to network.
// Since Chit Manager has no API calls, everything comes from cache.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Found in cache — serve it instantly (offline works!)
          return cachedResponse;
        }
        // Not in cache — try the network
        return fetch(event.request)
          .catch(() => {
            // Network also failed — app is fully offline
            // For an HTML-only app this should never matter
            console.warn('[SW] Fetch failed for:', event.request.url);
          });
      })
  );
});
