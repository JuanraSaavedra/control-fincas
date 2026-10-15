const V = 'fincas-v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icono2-180.png', 'icono2-192.png', 'icono2-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === self.location.origin;
  if (same) {
    // Archivos de la app: primero red (para recibir actualizaciones), si no hay red, copia guardada
    e.respondWith(
      fetch(e.request)
        .then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; })
        .catch(() => caches.match(e.request).then(m => m || caches.match('index.html')))
    );
  } else {
    // Librería de Excel y tipografías: se guardan la primera vez y luego funcionan sin conexión
    e.respondWith(
      caches.match(e.request).then(m => m || fetch(e.request).then(r => {
        const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r;
      }))
    );
  }
});
