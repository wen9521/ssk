// js/main.js
import { renderLobby, clearContainer } from './ui/lobbyUI.js';
import { renderGame, updateHand, showPlayedCards } from './ui/gameUI.js';
import { DouDizhuGame } from './gameLogic/doudizhu.js';

const appContainer = document.getElementById('app-container');
let game;

// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

function startOfflineGame() {
    clearContainer(appContainer);
    game = new DouDizhuGame();
    game.startGame();

    // 渲染游戏界面
    renderGame(appContainer, game, handlePlay, handlePass);
}

function startOnlineGame() {
    alert("在线模式正在开发中！");
    // TODO:
    // 1. import websocketClient from './network/websocketClient.js'
    // 2. websocketClient.connect('wss://9525.ip-ddns.com:PORT');
    // 3. 设置 onMessage 回调来处理服务器消息并更新UI
}

function handlePlay(selectedCards) {
    if (!game || game.turn !== 0) { // 确保是玩家的回合
        alert("还没轮到你出牌！");
        return;
    }
    
    if (game.isValidPlay(selectedCards)) {
        const isGameOver = game.play(selectedCards);
        showPlayedCards(selectedCards);
        updateHand('player', game.players[0].hand);
        
        if (isGameOver) {
            alert("你赢了！");
            showLobby();
            return;
        }

        // AI回合
        setTimeout(runAITurn, 1000);
    } else {
        alert("出牌不符合规则！");
    }
}

function handlePass() {
    handlePlay([]);
}

function runAITurn() {
    if (game.turn === 0) return; // 如果轮到玩家了就停止

    const playedCards = game.aiTurn();
    const aiId = game.players[(game.turn + 2) % 3].id; // 刚出完牌的AI
    showPlayedCards(playedCards, aiId);
    updateHand(aiId, game.players.find(p => p.id === aiId).hand);

    if (game.players.find(p => p.id === aiId).hand.length === 0) {
        alert(`${aiId} 赢了!`);
        showLobby();
        return;
    }

    if (game.turn !== 0) {
        setTimeout(runAITurn, 1000);
    }
}


function showLobby() {
    renderLobby(appContainer, startOfflineGame, startOnlineGame);
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    showLobby();
});
