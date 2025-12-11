// Service Worker for PWA Support
const CACHE_NAME = 'meal-pass-v1';

// Skip service worker registration during development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  // Immediately unregister the service worker in development
  self.registration.unregister();
}
const urlsToCache = [
  '/',
  '/index.html',
  // Removed specific component paths as they are bundled in the build
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip all requests in development
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return;
  }
  
  // Skip API and socket requests
  if (event.request.url.includes('/api/') || event.request.url.includes('/socket.io/')) {
    return;
  }
  
  // Skip requests that are not GET requests or not same-origin
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip requests to external domains (like CDN, analytics, etc.)
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    // Skip Crowdin and other third-party CDNs
    if (requestUrl.hostname.includes('crowdin') || requestUrl.hostname.includes('cdn')) {
      return;
    }
    // For other external requests, let them pass through normally
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((cacheError) => {
              // Log cache errors but don't break the response
              console.warn('Service worker cache error:', cacheError);
            });
            
          return response;
        }).catch((error) => {
          // If fetch fails, return appropriate fallback response only for navigation requests
          console.error('Service worker fetch error:', error);
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          // For API requests, try to return cached response if available
          if (event.request.url.includes('/api/')) {
            return caches.match(event.request).then(cachedResponse => {
              return cachedResponse || Response.error();
            }).catch(() => {
              return Response.error();
            });
          }
          // For other requests, return a network error response
          return Response.error();
        });
      })
      .catch((error) => {
        // If cache match fails and we're offline, return fallback for navigation requests
        console.error('Service worker cache error:', error);
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        // For other requests, return a network error response
        return Response.error();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle background sync for offline scans
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scans') {
    event.waitUntil(syncScans());
  }
});

// Function to sync cached scans with backend
async function syncScans() {
  try {
    // Get cached scans from IndexedDB or localStorage
    const cachedScans = JSON.parse(localStorage.getItem('cached_scans') || '[]');
    const unsyncedScans = cachedScans.filter(scan => !scan.synced);
    
    if (unsyncedScans.length === 0) return;
    
    // Sync each scan with backend
    for (const scan of unsyncedScans) {
      try {
        // Make API call to sync scan
        const response = await fetch('/api/feeding/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uniqueId: scan.uniqueId,
            deviceId: 'pwa-offline-sync',
            method: 'scan'
          })
        });
        
        if (response.ok) {
          // Mark as synced in cache
          const updatedScans = cachedScans.map(s => 
            s.id === scan.id ? { ...s, synced: true } : s
          );
          localStorage.setItem('cached_scans', JSON.stringify(updatedScans));
        } else {
          console.warn('Failed to sync scan, server response:', response.status);
        }
      } catch (error) {
        console.error('Failed to sync scan:', error);
        // Continue with other scans even if one fails
      }
    }
  } catch (error) {
    console.error('Failed to sync scans:', error);
  }
}