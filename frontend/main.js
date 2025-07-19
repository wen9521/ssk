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

// --- 核心UI更新与特效 ---

function showSpecialEffect(text) {
    const effectDiv = document.createElement('div');
    effectDiv.className = 'special-effect-container';
    effectDiv.textContent = text;
    document.body.appendChild(effectDiv);
    setTimeout(() => effectDiv.remove(), 1500);
}

function playCardEffects(cardType) {
    if (!cardType || !cardType.type) return;
    const type = cardType.type;
    const soundMap = {
        'trio': 'trio', 'trio_single': 'trio_single', 'trio_pair': 'trio_pair',
        'straight': 'straight', 'pair': 'pair', 'bomb': 'bomb', 'rocket': 'rocket',
        'airplane': 'airplane', 'airplane_singles': 'airplane', 'airplane_pairs': 'airplane'
    };
    // 由于斗地主音效文件缺失，暂时禁用
    // playSound(soundMap[type] || 'playCard');

    if (type === 'bomb') showSpecialEffect('炸弹！');
    if (type === 'rocket') showSpecialEffect('火箭！');
    if (type.includes('airplane')) showSpecialEffect('飞机！');
    if (type === 'straight') showSpecialEffect('顺子！');
}


// --- 斗地主游戏逻辑 ---

function startDoudizhuOffline() {
    currentGame = new DouDizhuGame(['您', '下家AI', '上家AI']);
    currentGame.startGame();
    app.innerHTML = renderGameBoard(currentGame.players);
    currentGame.players.forEach(p => {
        renderPlayerHand(`hand-${p.id}`, p.hand, p.id !== 'player-0');
        updateCardCount(p.id, p.hand.length);
    });
    biddingLoop();
}

function biddingLoop() {
    if (currentGame.gameState !== 'bidding') {
        finalizeDoudizhuBoard();
        return;
    }
    const currentPlayer = currentGame.getCurrentBiddingPlayer();
    updateUITurn(currentPlayer, 'bidding');

    if (currentPlayer.id === 'player-0') {
        const container = document.querySelector('.player-area.bottom-player');
        container.insertAdjacentHTML('beforeend', renderBiddingControls(currentGame.highestBid));
        document.getElementById('bidding-container').addEventListener('click', handleDoudizhuBidClick);
    } else {
        updatePlayerStatus(currentPlayer.id, '思考中...');
        setTimeout(() => {
            const bid = currentGame.aiSimpleBid(currentPlayer.id);
            currentGame.playerBid(currentPlayer.id, bid);
            const bidText = bid > currentGame.highestBid ? `${bid}分` : '不叫';
            // playSound(bid > 0 ? `bid${bid}` : 'pass'); // 斗地主音效禁用
            updatePlayerStatus(currentPlayer.id, bidText);
            biddingLoop();
        }, 1500);
    }
}

function handleDoudizhuBidClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    
    const bid = parseInt(button.dataset.bid, 10);
    // playSound(bid > 0 ? `bid${bid}` : 'pass'); // 斗地主音效禁用
    
    currentGame.playerBid('player-0', bid);
    document.getElementById('bidding-container').remove();
    updatePlayerStatus('player-0', bid > 0 ? `${bid}分` : '不叫', true);
    setTimeout(biddingLoop, 100);
}

function finalizeDoudizhuBoard() {
    const landlord = currentGame.players.find(p => p.isLandlord);
    if (!landlord) {
        alert('流局，无人叫地主！即将重新发牌。');
        startDoudizhuOffline();
        return;
    }
    // Finalize UI
    document.querySelector(`#${landlord.id} .player-name`).innerHTML += ' (地主)';
    renderPlayedCards('landlord-cards-area', currentGame.landlordCards);
    renderPlayerHand(`hand-${landlord.id}`, landlord.hand, landlord.id !== 'player-0');
    updateCardCount(landlord.id, landlord.hand.length);
    const container = document.querySelector('.player-area.bottom-player');
    container.insertAdjacentHTML('beforeend', `
        <div id="play-buttons-container" class="action-buttons-container">
            <button id="pass-btn" class="action-btn pass" disabled>不要</button>
            <button id="play-btn" class="action-btn play" disabled>出牌</button>
        </div>
    `);
    document.getElementById('play-btn').addEventListener('click', handleDoudizhuPlay);
    document.getElementById('pass-btn').addEventListener('click', handleDoudizhuPass);

    doudizhuGameLoop();
}

function doudizhuGameLoop() {
    if (currentGame.gameState === 'ended') {
        endDoudizhuGame(currentGame.getWinner());
        return;
    }
    const currentPlayer = currentGame.getCurrentPlayingPlayer();
    updateUITurn(currentPlayer, 'playing');
    if (currentPlayer.id !== 'player-0') setTimeout(doudizhuAiTurn, 1200);
}

function handleDoudizhuPlay() {
    const selected = document.querySelectorAll('#hand-player-0 .card.selected');
    if (selected.length === 0) return;

    const cardIds = Array.from(selected).map(el => el.dataset.cardId);
    const result = currentGame.playCards('player-0', cardIds);
    
    if (result) {
        playCardEffects(result.cardType);
        renderPlayedCards('played-cards-area', result.playedCards);
        renderPlayerHand('player-0', currentGame.getPlayerById('player-0').hand, false);
        updateCardCount('player-0', currentGame.getPlayerById('player-0').hand.length);
        doudizhuGameLoop();
    } else {
        alert("出牌不符合规则！");
    }
}

function handleDoudizhuPass() {
    if (currentGame.passTurn('player-0')) {
        // playSound('pass'); // 斗地主音效禁用
        updatePlayerStatus('player-0', '不要', true);
        doudizhuGameLoop();
    } else {
        alert("轮到你首次出牌，不能不要！");
    }
}

function doudizhuAiTurn() {
    const aiPlayer = currentGame.getCurrentPlayingPlayer();
    const result = currentGame.aiSimplePlay(aiPlayer.id);

    if (result && result.playedCards) {
        playCardEffects(result.cardType);
        renderPlayedCards('played-cards-area', result.playedCards);
        updatePlayerStatus(aiPlayer.id, '');
    } else {
        // playSound('pass'); // 斗地主音效禁用
        updatePlayerStatus(aiPlayer.id, '不要');
    }
    updateCardCount(aiPlayer.id, aiPlayer.hand.length);
    renderPlayerHand(`hand-${aiPlayer.id}`, aiPlayer.hand, true);
    doudizhuGameLoop();
}

function endDoudizhuGame(winner) {
    stopSound('doudizhu-bgMusic');
    const isWinner = winner.id === 'player-0';
    const finalScore = currentGame.baseScore * currentGame.multiplier;
    let message = `游戏结束！
${isWinner ? "恭喜你，你赢了！" : `你输了，胜利者是 ${winner.name}。`}
底分: ${currentGame.baseScore} x 倍数: ${currentGame.multiplier} = 总分: ${finalScore}`;
    if (currentGame.multiplier > 1) {
        if ((winner.isLandlord && currentGame.players.every(p => p.isLandlord || p.playsCount === 0)) ||
            (!winner.isLandlord && currentGame.players.find(p => p.isLandlord).playsCount <= 1)) {
            message += "
(春天或反春 x2)";
        }
    }
    setTimeout(() => {
        // playSound(isWinner ? 'doudizhu-win' : 'doudizhu-lose'); // 斗地主音效禁用
        alert(message);
        showLobby();
    }, 1000);
}

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
        // playSound('doudizhu-bgMusic', { loop: true, volume: 0.3 }); // 斗地主音效禁用
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


// --- 游戏流程管理 (Common) ---
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
        // playSound('doudizhu-bgMusic', { loop: true, volume: 0.3 }); // 斗地主音效禁用
        startDoudizhuOffline();
    } else if (gameId === 'thirteen-water') {
        playSound('thirteen-water-bgMusic', { loop: true, volume: 0.4 });
        startThirteenWaterOffline();
    } else {
        alert('该游戏暂未开放！');
    }
}

function updatePlayerStatus(playerId, text, isYou = false) {
    if (isYou) {
        let indicator = document.querySelector('.bidding-status-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'bidding-status-indicator';
            const container = document.querySelector('.player-area.bottom-player');
            if (container) container.appendChild(indicator);
        }
        indicator.textContent = text;
        setTimeout(() => indicator?.remove(), 1200);
    } else {
        const statusEl = document.getElementById(`status-${playerId}`);
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.classList.toggle('visible', !!text);
        }
    }
}

function updateUITurn(player, phase) {
    document.querySelectorAll('.player-pod').forEach(el => el.style.boxShadow = 'none');
    const playerEl = document.getElementById(player.id);
    if(playerEl) playerEl.style.boxShadow = '0 0 25px var(--accent-color)';

    if (phase === 'playing' && document.getElementById('play-btn')) {
        const isMyTurn = player.id === 'player-0';
        const canPass = currentGame.lastValidPlay.playerId && currentGame.passPlayCount < currentGame.players.length - 1;
        document.getElementById('play-btn').disabled = !isMyTurn;
        document.getElementById('pass-btn').disabled = !isMyTurn || !canPass;
    }
}

// --- 应用初始化 ---
document.addEventListener('DOMContentLoaded', showLobby);
