// --- 模块导入 ---
import { renderLobby } from './src/components/lobby.js';
import { playSound, stopSound } from './src/services/audio-service.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand, updateCardCount, renderPlayedCards } from './src/components/card.js';
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';
import { renderBiddingControls } from './src/components/bidding-ui.js';
import { ThirteenWaterGame } from './src/game-logic/thirteen-water-rules.js';
import { renderThirteenWaterBoard } from './src/components/thirteen-water-ui.js';

// --- 全局变量 ---
const app = document.getElementById('app');
let currentGame = null;
let playerGroups = [[], [], []]; // For Thirteen Water manual grouping

// --- 游戏流程管理 ---

function showLobby() {
    stopSound('doudizhu-bgMusic');
    stopSound('thirteen-water-bgMusic');
    app.innerHTML = renderLobby();
    document.querySelectorAll('.game-card').forEach(card => {
        const gameId = card.dataset.game;
        card.querySelector('.lobby-btn.trial')?.addEventListener('click', () => {
            playSound('gameStart');
            startGame(gameId, 'offline');
        });
    });
}

function startGame(gameId, mode) {
    if (mode === 'online') {
        alert('在线匹配模式正在开发中！');
        return;
    }
    if (gameId === 'doudizhu') {
        playSound('doudizhu-bgMusic', { loop: true, volume: 0.3 });
        startDoudizhuOffline();
    } else if (gameId === 'thirteen-water') {
        playSound('thirteen-water-bgMusic', { loop: true, volume: 0.4 });
        startThirteenWaterOffline();
    } else {
        alert('该游戏暂未开放！');
    }
}

// --- 十三水游戏逻辑 ---

function startThirteenWaterOffline() {
    playSound('thirteen-water-start');
    currentGame = new ThirteenWaterGame(['您', 'AI-2', 'AI-3', 'AI-4']);
    currentGame.startGame();
    
    playerGroups = [[], [], []]; // Reset groups

    app.innerHTML = renderThirteenWaterBoard(currentGame.players, handleCardDrop);

    setTimeout(() => {
        playSound('thirteen-water-deal');
        renderPlayerHand('player-hand-area', currentGame.players[0].hand, true); // Make cards draggable
    }, 500);

    // AI auto-groups
    for (let i = 1; i < 4; i++) {
        currentGame.autoGroup(currentGame.players[i].id);
    }
    
    // Setup buttons
    document.getElementById('auto-group-btn').onclick = autoGroupAndRender;
    document.getElementById('compare-btn').onclick = compareThirteenWater;
}

function handleCardDrop(cardElement, targetDun) {
    const cardId = cardElement.dataset.cardId;
    const dunIndex = parseInt(targetDun.dataset.dunIndex, 10);
    const dunLimits = [3, 5, 5];

    // Remove card from any previous group it was in
    playerGroups.forEach(group => {
        const index = group.findIndex(c => c.id === cardId);
        if (index > -1) group.splice(index, 1);
    });

    // Check if the target dun is full
    if (playerGroups[dunIndex].length >= dunLimits[dunIndex]) {
        // Simple rejection: move card back to hand
        document.getElementById('player-hand-area').appendChild(cardElement);
        return false; // Prevent drop
    }
    
    const card = currentGame.players[0].hand.find(c => c.id === cardId);
    playerGroups[dunIndex].push(card);
    
    checkAllDunsValidity();
    return true; // Allow drop
}

function checkAllDunsValidity() {
    const compareBtn = document.getElementById('compare-btn');
    const totalCards = playerGroups.reduce((sum, g) => sum + g.length, 0);
    if (totalCards === 13) {
        // A full implementation would check for "倒水" here.
        // For now, we just enable the button.
        compareBtn.disabled = false;
    } else {
        compareBtn.disabled = true;
    }
}

function autoGroupAndRender() {
    playSound('thirteen-water-set');
    currentGame.autoGroup('player-0');
    playerGroups = currentGame.players[0].groups;

    // Clear all areas and re-render
    document.getElementById('player-hand-area').innerHTML = '';
    document.getElementById('front-dun').innerHTML = '';
    document.getElementById('middle-dun').innerHTML = '';
    document.getElementById('back-dun').innerHTML = '';
    
    renderPlayerHand('front-dun', playerGroups[0], true);
    renderPlayerHand('middle-dun', playerGroups[1], true);
    renderPlayerHand('back-dun', playerGroups[2], true);
    
    checkAllDunsValidity();
}

function compareThirteenWater() {
    playSound('thirteen-water-compare');
    currentGame.players[0].groups = playerGroups; // Set final groups for player 0
    
    const results = currentGame.compareAll();

    const resultsArea = document.getElementById('thirteen-water-results');
    resultsArea.style.display = 'flex';
    resultsArea.innerHTML = results.map(res => {
        let content;
        if (res.specialType) {
            content = `<div class="special-type-display">${res.specialType.name}</div>`;
        } else {
            content = res.groups.map(g => `
                <div class="group-display">
                    <p>${g.name}</p>
                    <div class="hand">${g.cards.map(c => `<div class="card"><img src="/assets/cards/${c.svg}" alt="${c.fullName}"></div>`).join('')}</div>
                </div>`).join('');
        }
        return `
            <div class="player-result">
                <h4>${res.name} (${res.score > 0 ? '+' : ''}${res.score}分)</h4>
                ${content}
            </div>`;
    }).join('');

    const myResult = results.find(r => r.id === 'player-0');
    setTimeout(() => {
        playSound(myResult.score >= 0 ? 'thirteen-water-win' : 'thirteen-water-lose');
        if (myResult.score > 10) playSound('thirteen-water-gunshot');

        setTimeout(() => {
             alert(`比牌结束！
你获得了 ${myResult.score} 分。`);
             showLobby();
        }, 4000);
    }, 1500);
}

// --- Dou Dizhu logic (remains unchanged) ---
// ... all doudizhu functions ...

// --- 应用初始化 ---
document.addEventListener('DOMContentLoaded', showLobby);
