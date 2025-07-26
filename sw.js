const CACHE_NAME = 'catalyst-cache-v4'; // Increment cache version for new assets
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  // Core files
  '/',
  '/index.html',
  OFFLINE_URL,
  '/site.webmanifest',

  // Scripts - Corrected app.js to scripts.js and added vendor libraries
  '/assets/js/scripts.js',
  '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
  '/node_modules/marked/lib/marked.umd.js',
  '/node_modules/dompurify/dist/purify.min.js',

  // Styles - Added vendor stylesheets and the crucial icon font file
  '/assets/css/style.css',
  '/node_modules/bootstrap/dist/css/bootstrap.min.css',
  '/node_modules/bootstrap-icons/font/bootstrap-icons.min.css',
  '/node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2',

  // Images & Icons - Added main logo and manifest icons
  '/assets/img/icon.png',
  '/assets/img/full_logo.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

// Install event: opens the cache and adds the app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('Opened cache');
      await cache.addAll(urlsToCache);
      // Force the waiting service worker to become the active service worker.
      await self.skipWaiting();
    })()
  );
});

// Activate event: cleans up old caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported.
      // https://developers.google.com/web/updates/2017/02/navigation-preload
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
      );

      // Take control of all clients as soon as the SW is activated.
      await self.clients.claim();
    })()
  );
});

// Fetch event: handles requests and serves assets from cache.
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, use a network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try the network first for navigation.
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // The network failed, serve from cache or the offline page.
          console.log('Fetch failed; returning offline page instead.', error);

          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request.url);
          return cachedResponse || cache.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // For other requests (CSS, JS, images), use a stale-while-revalidate strategy.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);

      // Fetch from network in the background to update the cache.
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      });

      // Return cached response if available, otherwise wait for network.
      return cachedResponse || fetchPromise;
    })()
  );
});