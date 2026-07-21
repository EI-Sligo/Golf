const CACHE_NAME = 'caddy-app-cache-v3';
const MAP_CACHE = 'caddy-map-tiles-v1';

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install Event: Activate new service worker immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate Event: Purge old cached app code immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key !== MAP_CACHE) {
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for Code, Cache-First for Map Tiles
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Map Tiles: Serve from cache offline
  if (url.hostname === 'server.arcgisonline.com') {
    event.respondWith(
      caches.open(MAP_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) return response;
          return fetch(event.request).then(netRes => {
            cache.put(event.request, netRes.clone());
            return netRes;
          }).catch(() => {});
        });
      })
    );
    return;
  }

  // 2. Code Files: Check network FIRST so updates show up, fallback to offline cache if no service
  event.respondWith(
    fetch(event.request).then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        const resClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
      }
      return networkResponse;
    }).catch(() => caches.match(event.request))
  );
});