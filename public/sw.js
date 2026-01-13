const CACHE_NAME = 'stricto-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './dashboard.html',
    './styles.css',
    './mobile.css',
    './dashboard.js',
    './auth.js',
    './app.js',
    './analytics.html',
    './analytics.js',
    './achievements.html',
    './achievements.js',
    './settings.html',
    './settings.js',
    './manifest.json',
    'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js',
    'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js'
];

// Install Event - Cache Files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all: app shell and content');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Fetch Event - Network First, then Cache (Strategy for dynamic dashboard)
self.addEventListener('fetch', (event) => {
    // Skip chrome-extension schemes and cross-origin API calls if needed
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // If network fails, return from cache
                return caches.match(event.request);
            })
    );
});
