/**
 * public/service-worker.js
 * 
 * 功能：
 * 1. 在 'install' 事件中，缓存所有核心应用文件和扑克牌图片。
 * 2. 在 'fetch' 事件中，拦截网络请求。如果缓存中存在请求的资源，则直接从缓存返回，
 *    实现秒开和离线访问；否则，才通过网络去请求。
 * 3. 定义了缓存的版本号，方便未来更新缓存。
 */

// 缓存版本号，当你更新了任何需要缓存的文件时，修改此版本号可以强制更新用户的缓存。
const CACHE_NAME = 'card-game-v2';

// 基础核心文件，是应用运行所必需的。
const CORE_ASSETS = [
    '/', // 对应 index.html
    'index.html',
    'manifest.json',
    'css/style.css',
    'css/game.css',
    'js/main.js',
    'js/constants.js',
    'js/utils/cardParser.js',
    'js/utils/deck.js',
    'js/gameLogic/doudizhu.js',
    'js/ui/lobbyUI.js',
    'js/ui/gameUI.js',
    'js/network/websocketClient.js'
];

// 动态生成所有扑克牌图片的路径
function getCardImageUrls() {
    const cardValues = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
    const cardSuits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const urls = [];
    
    for (const suit of cardSuits) {
        for (const value of cardValues) {
            urls.push(`cards/${value}_of_${suit}.svg`);
        }
    }
    
    urls.push('cards/red_joker.svg');
    urls.push('cards/black_joker.svg');
    
    return urls;
}

// 合并所有需要缓存的资源
const urlsToCache = [
    ...CORE_ASSETS,
    ...getCardImageUrls()
];


// 1. 安装 Service Worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Install');
    // waitUntil 会等待内部的 Promise 完成后才算安装成功
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching all: app shell and content');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[Service Worker] Caching failed:', error);
            })
    );
});

// 2. 激活 Service Worker (可选，用于清理旧缓存)
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                // 如果缓存名不是当前版本，就删除它
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // 确保新的 Service Worker 立即控制页面
    return self.clients.claim();
});


// 3. 拦截网络请求 (核心功能)
self.addEventListener('fetch', event => {
    // 我们只对 GET 请求进行缓存策略
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        // 首先，尝试从缓存中查找匹配的请求
        caches.match(event.request)
            .then(cachedResponse => {
                // 如果在缓存中找到了，直接返回缓存的响应
                if (cachedResponse) {
                    // console.log(`[Service Worker] Returning from cache: ${event.request.url}`);
                    return cachedResponse;
                }

                // 如果缓存中没有，则通过网络去请求
                // console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
                return fetch(event.request);
            })
            .catch(error => {
                // 网络请求失败时（比如离线），可以返回一个备用的离线页面
                // 但对于这个游戏应用，只要核心文件被缓存，即使后续API请求失败也能玩单机，所以这里可以不处理
                console.error(`[Service Worker] Fetch failed: ${event.request.url}`, error);
            })
    );
});
