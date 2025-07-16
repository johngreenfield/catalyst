const CACHE_NAME = 'catalyst-cache-v2';
let urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/img/icon.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  // TODO: For full offline support, you should download the bootstrap-icons font files (woff2) 
  // and serve them locally, then add their paths to this cache list.
    '/site.webmanifest',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png'
];

// Critical resources to be cached with Cache-First strategy
const criticalResources = ['/index.html', '/assets/js/app.js'];

// Install event: opens the cache and adds the app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: serves requests from the cache first if available.
// This uses a "Stale-While-Revalidate" strategy for cached assets.
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Cache-First strategy for critical resources
    if (criticalResources.includes(url.pathname)) {
        event.respondWith(
            caches.match(event.request).then(response => {
                // Return cached version if available, otherwise fetch from network
                return response || fetch(event.request);
            })
        );
    } else {
        // Stale-While-Revalidate for other assets
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    // Fetch the latest version from the network in the background.
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        // If we get a valid response, update the cache.
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });

                    // Return the cached version immediately if available, otherwise wait for the network.
                    return response || fetchPromise;
                });
            })
        );
    }
});

// Activate event: cleans up old caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
      );
    })
  );
});