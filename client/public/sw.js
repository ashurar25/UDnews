// Service Worker for Push Notifications
const CACHE_NAME = 'udnews-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push event
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'ข่าวด่วนจากอุดรธานี',
    icon: '/logo.jpg',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'อ่านข่าว',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'ปิด',
        icon: '/images/xmark.png'
      }
    ]
  };

  const promiseChain = self.registration.showNotification('ข่าวอุดร', options);
  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});