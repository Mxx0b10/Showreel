// Showreel Studio service worker — network-first with cache fallback.
// Paths are computed relative to the SW's own location so the app works
// whether deployed at apex (/) or subpath (/repo-name/).
const CACHE = 'showreel-v1';
const BASE = new URL('./', self.location).pathname;
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon.svg',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Network-first: keep app fresh online, fall back to cache offline.
  e.respondWith(
    fetch(req)
      .then(r => {
        if (r.ok && new URL(req.url).origin === self.location.origin) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return r;
      })
      .catch(() =>
        caches.match(req).then(r => r || caches.match(BASE + 'index.html'))
      )
  );
});
