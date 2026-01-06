const CACHE_NAME = 'pam-cache-v1';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './css/responsive.css',
    './js/config.js',
    './js/store.js',
    './js/utils.js',
    './js/renderers.js',
    './js/app.js',
    './icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@500;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
