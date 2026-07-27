const CACHE_NAME = 'relay-pwa-v3';

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
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    // Check if any app window is currently open and focused
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find any window that is currently focused and visible
      const focusedClient = windowClients.find(
        (c) => c.focused === true && c.visibilityState === 'visible'
      );

      if (focusedClient) {
        // App is open and in focus — send push data to the app directly.
        // The React app will show its own in-app toast. Skip the native notification.
        focusedClient.postMessage({
          type: 'PUSH_WHILE_FOCUSED',
          payload: data,
        });
        return; // DO NOT show native notification
      }

      // No focused window — app is backgrounded or closed.
      // Show the native OS notification.
      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
