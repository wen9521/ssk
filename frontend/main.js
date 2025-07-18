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
    const playerNames = ['你', '右侧AI', '左侧AI'];
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
    // ... (逻辑基本不变, 仅更新UI调用)
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
    const statusEl = document.getElementById(`status-${playerId}`);
    if (statusEl) {
        statusEl.textContent = text;
        statusEl.classList.add('visible');
        if(text) {
            setTimeout(() => { statusEl.classList.remove('visible'); }, 1500);
        }
    }
}

function updateUITurn(currentPlayer) {
    const isMyTurn = currentPlayer.id === 'player-0';
    document.getElementById('play-btn').disabled = !isMyTurn;
    document.getElementById('pass-btn').disabled = !isMyTurn || !currentGame.lastValidPlay.playerId;

    document.querySelectorAll('.player-pod, .bottom-area').forEach(el => {
        el.style.boxShadow = 'none';
        el.style.borderColor = 'rgba(255,255,255,0.2)';
    });

    const playerEl = document.getElementById(currentPlayer.id);
    if (playerEl) {
        playerEl.style.boxShadow = `0 0 25px ${"var(--accent-color)"}`;
        playerEl.style.borderColor = 'var(--accent-color)';
    }
}

// --- 应用初始化 ---
function initialize() {
    // ... (屏幕方向检测逻辑现在尤其重要)
    const checkOrientation = () => {
        const maskElement = document.getElementById('orientation-mask');
        const appElement = document.getElementById('app');
        if (window.matchMedia("(orientation: portrait)").matches) {
            maskElement.style.display = 'flex';
            appElement.style.display = 'none';
        } else {
            maskElement.style.display = 'none';
            appElement.style.display = 'block'; // 改为 block 或 initial
        }
    };
    window.addEventListener('resize', checkOrientation);
    checkOrientation();

    showLobby();
}

document.addEventListener('DOMContentLoaded', initialize);
