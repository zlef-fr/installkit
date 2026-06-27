// Minimal offline shell so install.zlef.fr is itself an installable PWA
// (lets the landing demo the real native one-tap install path).
const CACHE = 'installkit-v3';
const SHELL = ['/', '/css/landing.css', '/js/landing.js', '/v1/install-kit.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      if (res.ok && req.url.indexOf('/api/') === -1) caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match('/')))
  );
});
