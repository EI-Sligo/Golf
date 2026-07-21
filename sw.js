const CACHE_NAME = 'caddy-app-cache-v2';
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

// Install Event: Cache Core App Files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME && name !== MAP_CACHE)
                  .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch Event: The Offline Engine
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 1. Intercept ESRI Satellite Map Tiles and save them offline!
  if (url.hostname === 'server.arcgisonline.com') {
    event.respondWith(
      caches.open(MAP_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) return response; // Serve map tile from offline cache
          
          return fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone()); // Save new tile to offline cache
            return networkResponse;
          }).catch(() => {
             // If completely offline and tile isn't saved, fail gracefully
          });
        });
      })
    );
    return;
  }

  // 2. Normal App Files (Cache First Strategy)
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});