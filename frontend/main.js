/**
 * main.js (适配经典布局版)
 */

// --- 模块导入 ---
import { renderLobby } from './src/components/lobby.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand, updateCardCount, renderPlayedCards } from './src/components/card.js';
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';
import { websocketClient } from './src/services/websocket.js';

// --- 全局变量 ---
const app = document.getElementById('app');
let currentGame = null;

// --- 核心功能 ---
function showLobby() {
    app.innerHTML = renderLobby();
    document.getElementById('start-offline-btn').addEventListener('click', startOfflineGame);
    document.getElementById('start-online-btn').addEventListener('click', () => alert('在线模式开发中'));
}

function startOfflineGame() {
    const playerNames = ['你', '右侧AI', '左侧AI'];
    currentGame = new DouDizhuGame(playerNames);
    app.innerHTML = renderGameBoard(currentGame.players);
    
    currentGame.startGame();
    
    // UI初始化渲染
    const you = currentGame.getPlayerById('player-0');
    renderPlayerHand(you.id, you.hand, true);
    
    const landlord = currentGame.players.find(p => p.isLandlord);
    if(landlord){
        const landlordNameEl = document.querySelector(`#${landlord.id} .player-name`);
        if(landlordNameEl) landlordNameEl.textContent += ' (地主)';
        renderPlayedCards('landlord-cards-area', currentGame.landlordCards);
    }
    
    document.getElementById('play-btn').addEventListener('click', handlePlayCard_Offline);
    document.getElementById('pass-btn').addEventListener('click', handlePass_Offline);
    
    gameLoop();
}

function startOnlineGame() { /* ... */ }

// --- 离线游戏循环 ---
function gameLoop() {
    if (currentGame.getWinner()) {
        endGame(currentGame.getWinner());
        return;
    }
    const currentPlayer = currentGame.getCurrentPlayer();
    updateUITurn(currentPlayer);
    if (currentPlayer.id !== 'player-0') {
        setTimeout(aiTurn, 1200);
    }
}

function handlePlayCard_Offline() {
    const selectedElements = document.querySelectorAll('#hand-player-0 .card.selected');
    if (selectedElements.length === 0) return;
    const cardIds = Array.from(selectedElements).map(el => el.dataset.cardId);
    const result = currentGame.playCards('player-0', cardIds);
    if (result) {
        renderPlayedCards('played-cards-area', result.playedCards);
        renderPlayerHand('player-0', currentGame.getPlayerById('player-0').hand, true);
        currentGame.nextTurn();
        gameLoop();
    } else {
        alert("出牌不符合规则！");
    }
}

function handlePass_Offline() {
    const success = currentGame.passTurn('player-0');
    if (success) {
        updatePlayerStatus('player-0', '不要');
        renderPlayedCards('played-cards-area', []); // 清空出牌区
        currentGame.nextTurn();
        gameLoop();
    } else {
        alert("轮到你首次出牌，不能不要！");
    }
}

function aiTurn() {
    const aiPlayer = currentGame.getCurrentPlayer();
    const result = currentGame.aiSimplePlay(aiPlayer.id);
    if (result) {
        renderPlayedCards('played-cards-area', result.playedCards);
        updatePlayerStatus(aiPlayer.id, '');
    } else {
        updatePlayerStatus(aiPlayer.id, '不要');
        renderPlayedCards('played-cards-area', []);
    }
    updateCardCount(aiPlayer.id, aiPlayer.hand.length);
    currentGame.nextTurn();
    gameLoop();
}

function endGame(winner) {
    setTimeout(() => {
        alert(`游戏结束！胜利者是 ${winner.name}!`);
        showLobby();
    }, 500);
}

// --- UI 更新辅助 ---
function updatePlayerStatus(playerId, text) {
    const statusEl = document.getElementById(`status-${playerId}`);
    if (statusEl) {
        statusEl.textContent = text;
        if(text) {
            setTimeout(() => { if(statusEl.textContent === text) statusEl.textContent = ''; }, 2000);
        }
    }
}

function updateUITurn(currentPlayer) {
    const isMyTurn = currentPlayer.id === 'player-0';
    document.getElementById('play-btn').disabled = !isMyTurn;
    document.getElementById('pass-btn').disabled = !isMyTurn || !currentGame.lastValidPlay.playerId;

    currentGame.players.forEach(p => {
        const playerEl = document.getElementById(p.id);
        if (playerEl) {
            if (p.id === currentPlayer.id) {
                playerEl.style.border = '2px solid var(--accent-color)';
                playerEl.style.boxShadow = '0 0 20px var(--accent-color)';
            } else {
                playerEl.style.border = 'none';
                playerEl.style.boxShadow = 'none';
            }
        }
    });
}

// --- 应用初始化 ---
function initialize() {
    // ... (Service Worker 和屏幕方向检测代码保持不变) ...
    showLobby();
}

document.addEventListener('DOMContentLoaded', initialize);
