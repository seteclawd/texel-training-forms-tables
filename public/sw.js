const CACHE_NAME = 'texel-training-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/form.html',
  '/form.js',
  '/vendor/jspdf.umd.min.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Navegaciones: primero red (así una versión nueva del formulario se ve al
  // instante) y la caché solo como respaldo sin conexión.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match('/')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
