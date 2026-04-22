const CACHE_NAME = 'todo-ai-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/main.js',
  '/js/app.js',
  '/js/ai.js',
  '/js/config.js',
  '/js/db.js',
  '/js/modal.js',
  '/js/ui.js',
  '/js/ux.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching App Shell');
        // Usando no-cors para assets de terceiros ou ignorando falhas
        return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))
          .catch(err => console.warn('[SW] Alguns assets externos podem não ter feito cache.', err));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removendo cache antigo', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Estratégia Stale-While-Revalidate para velocidade com atualização em background
self.addEventListener('fetch', (event) => {
  // Ignora chamadas para a API Groq ou outras APIs de dados no cache do SW
  if (event.request.url.includes('api.groq.com') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback ignorado se falhar a rede e tiver no cache
      });

      return cachedResponse || fetchPromise;
    })
  );
});
