// Minimal offline shell so install.zlef.fr is itself an installable PWA
// (lets the landing demo the real native one-tap install path).
//
// Strategy: NETWORK-FIRST for HTML/navigations so the landing is never stale when
// online (cache-first on the HTML was pinning returning visitors to an old shell);
// cache-first only for the versioned static assets (their ?v=N URL changes per
// release, so cache-first can never serve a stale version).
const CACHE = 'installkit-v5';
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

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('/', copy)); // refresh offline fallback
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // versioned static assets — cache-first
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      if (res.ok && req.url.indexOf('/api/') === -1) caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match('/')))
  );
});
