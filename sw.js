// sw.js
const CACHE_NAME = 'barbearia-sousa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css', // Seus arquivos de estilo
  '/app.js',     // Seu script principal
  '/icon-192.png',
  '/icon-512.png'
];

// Instalação: Cacheia os arquivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Fetch: Serve os arquivos do cache se estiver offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
