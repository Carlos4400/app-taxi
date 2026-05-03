const CACHE = 'mi-turno-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap',
];

let newVersion = null;

async function checkVersion() {
  try {
    const manifestReq = await fetch('./manifest.json?t=' + Date.now());
    if (manifestReq.ok) {
      const manifest = await manifestReq.json();
      if (manifest.version && manifest.version !== VERSION) {
        newVersion = manifest.version;
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({ type: 'NEW_VERSION', version: newVersion });
        });
      }
    }
  } catch (e) {}
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.hostname === 'localhost' && url.port === '3000') return;
  if (url.pathname.startsWith('/@')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        if (response.ok && (url.pathname.includes('/assets/') || url.pathname.endsWith('.js'))) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (url.origin === location.origin && url.pathname.endsWith('.html')) {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

setInterval(checkVersion, 30000);