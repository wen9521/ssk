const CACHE_NAME = 'card-game-v1';

// 动态生成所有卡牌图片URL
function getCardImageUrls() {
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const urls = [];
    for (const suit of suits) {
        for (const value of values) {
            urls.push(`/assets/cards/${value}_of_${suit}.svg`);
        }
    }
    urls.push('/assets/cards/red_joker.svg');
    urls.push('/assets/cards/black_joker.svg');
    return urls;
}

const urlsToCache = [
    '/',
    '/index.html',
    '/main.js',
    '/style.css',
    '/manifest.json',
    '/src/constants.js',
    '/src/services/card-parser.js',
    '/src/game-logic/deck.js',
    '/src/game-logic/doudizhu-rules.js',
    '/src/components/lobby.js',
    '/src/components/game-board.js',
    '/src/components/card.js',
    ...getCardImageUrls()
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
