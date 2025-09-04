
// Service Worker for UD News (cleaned)
// - Avoid duplicate declarations and simplify caching
// - Version bump forces clients to update SW when changed

const CACHE_NAME = 'ud-news-v4';
const PRECACHE_URLS = ['/', '/logo.jpg', '/placeholder.svg'];

// Utility: safe fetch without caching APIs
function shouldBypassCache(request) {
  try {
    // Only cache safe, same-origin GET requests over http(s)
    if (request.method !== 'GET') return true;
    const url = new URL(request.url);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    if (!isHttp) return true; // e.g., chrome-extension:, data:, blob:
    if (url.origin !== self.location.origin) return true; // third-party
    if (url.pathname.startsWith('/api/')) return true; // never cache APIs
    if (request.headers && request.headers.get && request.headers.get('range')) return true; // media range
    // Workaround Chrome bug when only-if-cached with cross-origin
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return true;
    return false;
  } catch {
    return true;
  }
}

// Install: pre-cache minimal shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // don't fail install due to precache issues
        console.warn('[SW] precache failed:', err);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  return Promise.resolve();
}
const urlsToCache = [
  '/',
  '/logo.jpg',
  '/placeholder.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to install service worker:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (shouldBypassCache(request)) return; // Let network handle

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        // Only cache successful, same-origin basic responses
        if (resp && resp.ok && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
        }
        return resp;
      }).catch(() => {
        if (request.destination === 'document') return caches.match('/');
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let notificationData = {
    title: 'UD News',
    body: 'มีข่าวสารใหม่จากอุดรธานี',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    tag: 'default',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'อ่านข่าว',
        icon: '/logo.jpg'
      },
      {
        action: 'close',
        title: 'ปิด',
        icon: '/logo.jpg'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
        data: {
          ...notificationData.data,
          ...payload.data
        }
      };
    } catch (error) {
      console.error('[SW] Error parsing push payload:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    actions: notificationData.actions,
    data: notificationData.data,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: notificationData.data.timestamp
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('[SW] Notification displayed successfully');
      })
      .catch((error) => {
        console.error('[SW] Error displaying notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        const fullUrl = urlToOpen.startsWith('http') ? urlToOpen : `${self.location.origin}${urlToOpen}`;
        return clients.openWindow(fullUrl);
      }
    }).catch((error) => {
      console.error('[SW] Error handling notification click:', error);
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Track notification close if needed
  event.waitUntil(
    fetch('/api/analytics/notification-close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag: event.notification.tag,
        timestamp: Date.now()
      })
    }).catch((error) => {
      console.error('[SW] Error tracking notification close:', error);
    })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'news-sync') {
    event.waitUntil(
      fetch('/api/news?limit=10')
        .then((response) => response.json())
        .then((data) => {
          console.log('[SW] Background sync completed, fetched', data.length, 'news items');
        })
        .catch((error) => {
          console.error('[SW] Background sync failed:', error);
        })
    );
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === 'CACHE_NEWS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Error event
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

// Unhandled rejection event
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service worker script loaded');
