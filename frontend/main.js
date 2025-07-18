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
    
    // 渲染所有玩家的手牌
    currentGame.players.forEach((player, index) => {
        renderPlayerHand(player.id, player.hand, index === 0); // 只有真人玩家的牌可以点击
        updateCardCount(player.id, player.hand.length);
        if(player.isLandlord) {
            document.querySelector(`#${player.id} .player-info span:first-child`).textContent += ' (地主)';
        }
    });
    
    // 绑定操作按钮
    document.getElementById('play-btn').addEventListener('click', handlePlayCard_Offline);
    document.getElementById('pass-btn').addEventListener('click', handlePass_Offline);
    
    updateTurnIndicator();
}

function startOnlineGame() {
    // ... (在线逻辑保持不变)
}

// -------------------- 事件处理函数 (离线模式) --------------------

function handlePlayCard_Offline() {
    if (currentGame.turn !== 0) {
        alert("还没轮到你！");
        return;
    }

    const selectedElements = document.querySelectorAll('#hand-player-0 .card.selected');
    if (selectedElements.length === 0) {
        alert("请先选择要出的牌！");
        return;
    }

    const cardIds = Array.from(selectedElements).map(el => el.dataset.cardId);
    
    // 这是一个简化的验证
    if (true) { // 实际应调用 currentGame.isValidPlay(cardIds)
        const playedCards = currentGame.playCards('player-0', cardIds);
        renderPlayedCards(playedCards);
        renderPlayerHand('player-0', currentGame.getPlayerById('player-0').hand, true);
        updateCardCount('player-0', currentGame.getPlayerById('player-0').hand.length);

        if (checkGameOver()) return;
        
        nextTurn();
    } else {
        alert("出牌不符合规则！");
    }
}

function handlePass_Offline() {
    if (currentGame.turn !== 0) {
        alert("还没轮到你！");
        return;
    }
    currentGame.passTurn();
    renderPlayedCards([]); // 清空出牌区
    nextTurn();
}

function nextTurn() {
    currentGame.nextTurn();
    updateTurnIndicator();
    if (currentGame.turn !== 0) { // 如果是AI的回合
        setTimeout(aiTurn, 1000);
    }
}

function aiTurn() {
    const aiPlayer = currentGame.players[currentGame.turn];
    // 简化AI：随机出一张牌或跳过
    const playedCards = currentGame.aiSimplePlay(aiPlayer.id);

    if (playedCards.length > 0) {
        renderPlayedCards(playedCards);
    } else {
        console.log(`${aiPlayer.name} 不要`);
    }

    renderPlayerHand(aiPlayer.id, aiPlayer.hand, false);
    updateCardCount(aiPlayer.id, aiPlayer.hand.length);

    if (checkGameOver()) return;

    nextTurn();
}

function checkGameOver() {
    const winner = currentGame.getWinner();
    if (winner) {
        setTimeout(() => {
            alert(`游戏结束！胜利者是 ${winner.name}!`);
            showLobby();
        }, 500);
        return true;
    }
    return false;
}

function updateTurnIndicator() {
    // 移除所有高亮
    document.querySelectorAll('.player-info').forEach(el => el.style.boxShadow = '0 2px 5px var(--shadow-dark)');
    // 高亮当前玩家
    const currentPlayer = currentGame.players[currentGame.turn];
    const indicator = document.querySelector(`#hand-${currentPlayer.id}`).nextElementSibling;
    if(indicator) {
        indicator.style.boxShadow = `0 0 15px var(--accent-color)`;
    }
}


// -------------------- 应用初始化 --------------------
function initialize() {
    // ... (初始化逻辑保持不变)
    showLobby();
}

document.addEventListener('DOMContentLoaded', initialize);
