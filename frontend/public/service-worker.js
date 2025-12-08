// Service Worker for PWA Support
const CACHE_NAME = 'meal-pass-v1';
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
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        // If fetch fails, return appropriate fallback response
        console.error('Service worker fetch error:', error);
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        // For module scripts, we should not return JSON
        const acceptHeader = event.request.headers.get('Accept');
        if (acceptHeader && acceptHeader.includes('text/html')) {
          return new Response('<!DOCTYPE html><html><head></head><body>Network error</body></html>', {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        // Don't return JSON for module scripts
        return fetch(event.request);
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
        // In a real implementation, you would make an API call here
        // For now, we'll simulate a successful sync
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