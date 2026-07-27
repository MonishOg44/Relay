const CACHE_NAME = 'relay-pwa-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Always bypass Service Worker for Vite dev server HMR & virtual modules
  if (
    url.includes('/@') ||
    url.includes('/node_modules/') ||
    url.includes('.vite/') ||
    url.includes('hot-update') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html') || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// ==========================================
// PUSH NOTIFICATIONS
// Only fires when app is fully CLOSED (no windows open at all).
// When the app is open (even backgrounded/minimized), the React app
// uses navigator.serviceWorker.ready.then(reg.showNotification()) directly.
// ==========================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (err) {
    console.error('Push event payload parsing failed:', err);
    return;
  }

  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: '/relay-icon-512-dark.png',
    badge: '/relay-icon-192-dark.png',
    data: data.data || {},
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'relay-notification',
    renotify: data.renotify !== undefined ? data.renotify : true,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If ANY window is open (focused or backgrounded), the React app handles notifications.
      // The React code uses reg.showNotification() directly — faster and more reliable.
      // We only need to show here when there are absolutely no open windows (app fully closed).
      if (windowClients.length > 0) {
        // App window exists — just forward to any focused client for in-app toast
        const focusedClient = windowClients.find(
          (c) => c.focused === true && c.visibilityState === 'visible'
        );
        if (focusedClient) {
          focusedClient.postMessage({
            type: 'PUSH_WHILE_FOCUSED',
            payload: data,
          });
        }
        // If window exists but not focused, React's visibility change listener handles it.
        // Don't show a duplicate native notification here.
        return;
      }

      // No windows at all — app is fully closed. Show native push notification.
      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
