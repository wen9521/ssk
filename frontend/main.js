/**
 * main.js (升级版)
 * 
 * 使用增强的游戏规则引擎驱动一个完整的离线游戏循环。
 */

// -------------------- 模块导入 --------------------
import { renderLobby } from './src/components/lobby.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand, updateCardCount, renderPlayedCards } from './src/components/card.js';
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';
import { websocketClient } from './src/services/websocket.js';

// -------------------- 全局变量和DOM引用 --------------------
const app = document.getElementById('app');
let currentGame = null;

// -------------------- 核心功能函数 --------------------

function showLobby() {
    app.innerHTML = renderLobby();
    document.getElementById('start-offline-btn').addEventListener('click', startOfflineGame);
    document.getElementById('start-online-btn').addEventListener('click', startOnlineGame);
}

function startOfflineGame() {
    const playerNames = ['你', '左侧AI', '上方AI'];
    currentGame = new DouDizhuGame(playerNames);
    app.innerHTML = renderGameBoard(currentGame.players);
    
    currentGame.startGame();
    
    // 渲染UI
    currentGame.players.forEach((player, index) => {
        const isPlayer = player.id === 'player-0';
        renderPlayerHand(player.id, player.hand, isPlayer);
        updateCardCount(player.id, player.hand.length);
        if(player.isLandlord) {
            const infoEl = document.querySelector(`#hand-${player.id} + .player-info span:first-child`);
            if (infoEl) infoEl.textContent += ' (地主)';
        }
    });
    
    // 绑定操作按钮
    document.getElementById('play-btn').addEventListener('click', handlePlayCard_Offline);
    document.getElementById('pass-btn').addEventListener('click', handlePass_Offline);
    
    // 游戏循环开始
    gameLoop();
}

function startOnlineGame() { /* ... 在线逻辑保持不变 ... */ }

// -------------------- 离线游戏循环和事件处理 --------------------

function gameLoop() {
    if (currentGame.getWinner()) {
        endGame(currentGame.getWinner());
        return;
    }

    updateTurnIndicator();

    const currentPlayer = currentGame.getCurrentPlayer();
    if (currentPlayer.id !== 'player-0') { // AI的回合
        document.getElementById('play-btn').disabled = true;
        document.getElementById('pass-btn').disabled = true;
        setTimeout(aiTurn, 1200); // 延迟让玩家看清
    } else { // 玩家的回合
        document.getElementById('play-btn').disabled = false;
        document.getElementById('pass-btn').disabled = !currentGame.lastValidPlay.playerId; // 如果是首出，不能"不要"
    }
}

function handlePlayCard_Offline() {
    const selectedElements = document.querySelectorAll('#hand-player-0 .card.selected');
    if (selectedElements.length === 0) {
        alert("请先选择要出的牌！");
        return;
    }

    const cardIds = Array.from(selectedElements).map(el => el.dataset.cardId);
    const result = currentGame.playCards('player-0', cardIds);

    if (result) {
        // 出牌成功
        renderPlayedCards(result.playedCards, '你');
        renderPlayerHand('player-0', currentGame.getPlayerById('player-0').hand, true);
        updateCardCount('player-0', currentGame.getPlayerById('player-0').hand.length);
        currentGame.nextTurn();
        gameLoop();
    } else {
        // 出牌失败
        alert("出牌不符合规则，请重新选择！");
    }
}

function handlePass_Offline() {
    const success = currentGame.passTurn('player-0');
    if (success) {
        renderPlayedCards([], '你选择了 不要');
        currentGame.nextTurn();
        gameLoop();
    } else {
        alert("现在轮到你出牌，不能选择“不要”！");
    }
}

function aiTurn() {
    const aiPlayer = currentGame.getCurrentPlayer();
    const result = currentGame.aiSimplePlay(aiPlayer.id);

    if (result) { // AI出牌了
        renderPlayedCards(result.playedCards, aiPlayer.name);
    } else { // AI“不要”
        renderPlayedCards([], `${aiPlayer.name} 不要`);
    }

    renderPlayerHand(aiPlayer.id, aiPlayer.hand, false);
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

// -------------------- UI 更新辅助函数 --------------------

function updateTurnIndicator() {
    document.querySelectorAll('.player-info').forEach(el => el.style.boxShadow = 'none');
    
    const currentPlayer = currentGame.getCurrentPlayer();
    if (!currentPlayer) return;

    const indicator = document.querySelector(`#hand-${currentPlayer.id}`).parentElement.querySelector('.player-info');
    if(indicator) {
        indicator.style.boxShadow = `0 0 15px var(--accent-color), 0 0 20px var(--accent-color) inset`;
    }
}

// 修改 renderPlayedCards 函数调用方式，传递出牌者信息
// 在 /frontend/src/components/card.js 中修改
// export function renderPlayedCards(cards, playerName = '') { ... }


// -------------------- 应用初始化 --------------------

function initialize() {
    if ('serviceWorker' in navigator) { /* ... */ }
    showLobby();
}

document.addEventListener('DOMContentLoaded', initialize);
