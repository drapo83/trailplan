const CACHE = 'trailplan-v1';
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Always go network-first for API calls
  if (url.hostname === 'api.anthropic.com' || url.hostname === 'nominatim.openstreetmap.org') {
    e.respondWith(fetch(e.request).catch(() => new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  // Cache-first for app shell
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
    if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
    return resp;
  })));
});
