const CACHE_NAME = 'limestone-pwa-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/register-service-worker.js',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png'
];

// Install: Cache critical static shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching static shell assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up stale caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Skip caching for non-GET requests or different schemes (e.g. chrome-extension://, file://)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Network-First strategy for JSON files and Weather APIs to ensure fresh local alerts and weather
  if (
    requestUrl.pathname.endsWith('.json') || 
    requestUrl.host.includes('api.open-meteo.com') || 
    requestUrl.host.includes('weather.gov') ||
    requestUrl.host.includes('nate-limestone.github.io')
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) return response;
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Offline: Returning cached JSON/API response');
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-First strategy for static assets, scripts, styles, and fonts
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(response => {
        // Cache newly fetched assets on the fly if from the same origin
        if (response && response.status === 200 && requestUrl.origin === self.location.origin) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
        }
        return response;
      });
    })
  );
});
