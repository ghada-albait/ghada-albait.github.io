// Offline shell cache: network first, fall back to cache
const CACHE = 'ghada-v18';
const SHELL = ['./', 'index.html', 'css/app.css?v=18', 'js/app.js?v=18', 'js/i18n.js', 'js/seed.js', 'js/help.js', 'js/firebase-config.js', 'manifest.webmanifest', 'favicon.svg', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

// ---- push notifications (sent by the GitHub Action via FCM, data-only) ----
self.addEventListener('push', e => {
  let p = {}; try { p = e.data ? e.data.json() : {}; } catch (x) { p = { data: { title: 'غداء البيت', body: e.data && e.data.text() } }; }
  const d = Object.assign({}, p.notification || {}, p.data || {});
  const title = d.title || 'غداء البيت';
  e.waitUntil(self.registration.showNotification(title, { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.tag || undefined, data: { url: d.url || './' }, dir: d.dir || 'auto', lang: d.lang || undefined }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { for (const c of cs) { if (c.url.startsWith(self.registration.scope)) { c.focus(); return c.navigate ? c.navigate(url).catch(() => {}) : null; } } return self.clients.openWindow(url); }));
});
