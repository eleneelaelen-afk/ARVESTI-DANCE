// Service Worker для студии танцев ARVESTI
// Обеспечивает надежные PUSH-уведомления на iPhone (iOS 16.4, 17, 18) и Android

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || 'Студия ARVESTI', {
      body: options?.body || '',
      icon: options?.icon || '/icon-192.png',
      badge: options?.badge || '/icon-192.png',
      tag: options?.tag || 'arvesti-notif-' + Date.now(),
      vibrate: [200, 100, 200],
      data: options?.data || { url: '/' },
      ...options,
    });
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { text: event.data ? event.data.text() : 'Новое уведомление от студии ARVESTI' };
  }

  const title = data.title || 'Студия ARVESTI';
  const options = {
    body: data.message || data.body || data.text || 'У вас новое сообщение от руководителя Линды Азизян',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification?.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
