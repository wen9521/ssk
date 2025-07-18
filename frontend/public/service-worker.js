const CACHE_NAME = 'card-game-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/game.css',
    '/js/main.js',
    '/js/constants.js',
    '/js/utils/cardParser.js',
    '/js/utils/deck.js',
    '/js/gameLogic/doudizhu.js',
    '/js/ui/lobbyUI.js',
    '/js/ui/gameUI.js',
    '/js/network/websocketClient.js',
    // 你需要手动或用脚本将所有SVG文件名添加进来
    '/cards/ace_of_spades.svg',
    '/cards/king_of_hearts.svg',
    // ... etc. for all 54 cards
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
                return response || fetch(event.request);
            })
    );
});
