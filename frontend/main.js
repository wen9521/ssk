import { renderLobby } from './src/components/lobby.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand } from './src/components/card.js';
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';

const app = document.getElementById('app');
let currentGame = null;

// 显示游戏大厅
function showLobby() {
    app.innerHTML = renderLobby();
    document.getElementById('start-offline-btn').addEventListener('click', startOfflineGame);
    document.getElementById('start-online-btn').addEventListener('click', () => alert('在线模式正在紧张开发中！'));
}

// 开始离线游戏
function startOfflineGame() {
    // 1. 创建游戏实例
    const playerNames = ['你', '上家 (AI)', '下家 (AI)'];
    currentGame = new DouDizhuGame(playerNames);
    
    // 2. 渲染游戏面板
    app.innerHTML = renderGameBoard(currentGame.players);
    
    // 3. 开始游戏（洗牌、发牌）
    currentGame.startGame();
    
    // 4. 渲染所有玩家的手牌
    currentGame.players.forEach(player => {
        renderPlayerHand(player.id, player.hand);
    });
    
    // 5. 绑定出牌和跳过按钮事件
    document.getElementById('play-btn').addEventListener('click', handlePlayCard);
    document.getElementById('pass-btn').addEventListener('click', handlePass);
}

// 处理玩家出牌
function handlePlayCard() {
    // 这是一个简化的示例，实际需要获取玩家选择的牌
    alert("出牌逻辑待实现！");
}

// 处理玩家跳过
function handlePass() {
    alert("跳过逻辑待实现！");
}


// 应用初始化函数
function initialize() {
    // 注册Service Worker以实现离线功能
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => console.log('Service Worker registered successfully:', registration))
                .catch(error => console.error('Service Worker registration failed:', error));
        });
    }
    
    // 默认显示游戏大厅
    showLobby();
}

// 启动应用
initialize();
