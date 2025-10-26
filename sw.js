const CACHE_NAME = 'super-gemini-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/metadata.json',
  '/logo.svg',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'
];

// Install event: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event: Network falling back to cache strategy
self.addEventListener('fetch', event => {
  // We only want to handle GET requests and avoid certain API domains.
  if (event.request.method !== 'GET' || event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    // Try the network first.
    fetch(event.request).then(networkResponse => {
      // If successful, clone the response, cache it, and return it.
      // Cloning is necessary because responses are streams and can only be consumed once.
      const responseToCache = networkResponse.clone();
      caches.open(CACHE_NAME).then(cache => {
        // We only cache valid responses to avoid caching errors.
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, responseToCache);
        }
      });
      return networkResponse;
    }).catch(error => {
      // If the network fails, try to serve from the cache.
      console.log('Service Worker: Network request failed. Trying to serve from cache.', error);
      return caches.match(event.request);
    })
  );
});


// Activate event: clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Keep the existing notification logic
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'scheduleNotification') {
    const { title, delayInSeconds } = event.data;
    
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: `Your reminder is ready!`,
        icon: '/logo.svg', // Path to the icon
      });
    }, delayInSeconds * 1000);
  }
});