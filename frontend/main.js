// --- 模块导入 --- (保持不变)
import { renderLobby } from './src/components/lobby.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand, updateCardCount, renderPlayedCards } from './src/components/card.js';
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';
import { websocketClient } from './src/services/websocket.js';

// --- 全局变量 --- (保持不变)
const app = document.getElementById('app');
let currentGame = null;

// --- 核心功能 ---
function showLobby() {
    app.innerHTML = renderLobby();
    document.getElementById('start-offline-btn').addEventListener('click', startOfflineGame);
    document.getElementById('start-online-btn').addEventListener('click', () => alert('在线模式开发中'));
}

function startOfflineGame() {
    const playerNames = ['您', '下家AI', '上家AI']; // 顺序：你->右->左
    currentGame = new DouDizhuGame(playerNames);
    app.innerHTML = renderGameBoard(currentGame.players);
    
    currentGame.startGame();
    
    // UI初始化
    renderPlayerHand('player-0', currentGame.getPlayerById('player-0').hand, true);
    
    const landlord = currentGame.players.find(p => p.isLandlord);
    if(landlord){
        const landlordNameEl = document.querySelector(`#${landlord.id} .player-name`);
        if(landlordNameEl) landlordNameEl.innerHTML += ' <span style="color: var(--accent-color)">(地主)</span>';
        renderPlayedCards('landlord-cards-area', currentGame.landlordCards);
    }
    
    document.getElementById('play-btn').addEventListener('click', handlePlayCard_Offline);
    document.getElementById('pass-btn').addEventListener('click', handlePass_Offline);
    
    gameLoop();
}

// --- 离线游戏循环 ---
function gameLoop() {
    if (currentGame.getWinner()) {
        endGame(currentGame.getWinner());
        return;
    }
    const currentPlayer = currentGame.getCurrentPlayer();
    updateUITurn(currentPlayer);
    if (currentPlayer.id !== 'player-0') {
        setTimeout(aiTurn, 1500);
    }
}

function handlePlayCard_Offline() {
    // ... (逻辑不变)
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
        renderPlayedCards('played-cards-area', []);
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
        updatePlayerStatus(aiPlayer.id, ''); // 清空状态
    } else {
        updatePlayerStatus(aiPlayer.id, '不要');
        renderPlayedCards('played-cards-area', []);
    }
    updateCardCount(aiPlayer.id, aiPlayer.hand.length);
    currentGame.nextTurn();
    gameLoop();
}

function endGame(winner) { /* ... (保持不变) */ }

// --- UI 更新辅助 ---
function updatePlayerStatus(playerId, text) {
    // 玩家自己的状态更新（暂不需要，但可扩展）
    if (playerId === 'player-0') return; 

    const statusEl = document.getElementById(`status-${playerId}`);
    if (statusEl) {
        statusEl.textContent = text;
        if(text) {
            statusEl.classList.add('visible');
            setTimeout(() => { statusEl.classList.remove('visible'); }, 1500);
        } else {
            statusEl.classList.remove('visible');
        }
    }
}

function updateUITurn(currentPlayer) {
    const isMyTurn = currentPlayer.id === 'player-0';
    document.getElementById('play-btn').disabled = !isMyTurn;
    document.getElementById('pass-btn').disabled = !isMyTurn || !currentGame.lastValidPlay.playerId;

    document.querySelectorAll('.player-pod').forEach(el => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = 'none';
    });

    const playerEl = document.getElementById(currentPlayer.id);
    if (playerEl) {
        playerEl.style.transform = 'scale(1.05)';
        playerEl.style.boxShadow = `0 0 25px var(--accent-color)`;
    }
}

// --- 应用初始化 ---
function initialize() {
    // ... (屏幕方向检测逻辑保持不变)
    showLobby();
}

document.addEventListener('DOMContentLoaded', initialize);
