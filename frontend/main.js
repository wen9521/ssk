// --- 模块导入 ---
import { renderLobby } from './src/components/lobby.js';
import { playSound, stopSound } from './src/services/audio-service.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand, updateCardCount, renderPlayedCards, renderStackedCards } from './src/components/card.js';
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';
import { renderBiddingControls } from './src/components/bidding-ui.js';
import { ThirteenWaterGame } from './src/game-logic/thirteen-water-rules.js';
import { renderThirteenWaterBoard } from './src/components/thirteen-water-ui.js';

// --- 全局变量 ---
const app = document.getElementById('app');
let currentGame = null;

// Global state for Thirteen Water game
let thirteenWaterGameState = {};

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
    // ... (sound and effect logic remains the same)
}


// --- 斗地主游戏逻辑 (omitted for brevity) ---
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
            updatePlayerStatus(currentPlayer.id, bidText);
            biddingLoop();
        }, 1500);
    }
}

function handleDoudizhuBidClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    
    const bid = parseInt(button.dataset.bid, 10);
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
            message += `
(春天或反春 x2)`;
        }
    }
    setTimeout(() => {
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
        startDoudizhuOffline();
    } else if (gameId === 'thirteen-water') {
        playSound('thirteen-water-bgMusic', { loop: true, volume: 0.4 });
        startThirteenWaterOffline();
    } else {
        alert('该游戏暂未开放！');
    }
}


// --- 十三水游戏逻辑 (Refactored) ---

function initializeThirteenWaterState() {
    thirteenWaterGameState = {
        isReady: false,
        hand: [],
        head: [],
        middle: [],
        tail: [],
        selected: { area: '', cards: [] },
        aiProcessed: [false, false, false],
        hasCompared: false,
        message: ''
    };
}

function startThirteenWaterOffline() {
    initializeThirteenWaterState();
    
    currentGame = new ThirteenWaterGame(['您', '小明', '小红', '小刚']);
    app.innerHTML = renderThirteenWaterBoard(currentGame.players);

    // --- Bind Event Listeners ---
    document.getElementById('exit-sss-btn').addEventListener('click', showLobby);
    document.getElementById('ready-btn').addEventListener('click', handleReadyClick);
    document.getElementById('auto-group-btn').addEventListener('click', autoGroupAndRender);
    document.getElementById('compare-btn').addEventListener('click', compareThirteenWater);

    renderThirteenWaterUI(); // Render initial empty state
}

function renderThirteenWaterUI() {
    const { hand, head, middle, tail, selected, isReady } = thirteenWaterGameState;

    const handContainer = document.getElementById('player-hand-area');
    const headDunContainer = document.querySelector('#front-dun .card-display-area');
    const middleDunContainer = document.querySelector('#middle-dun .card-display-area');
    const tailDunContainer = document.querySelector('#back-dun .card-display-area');

    // Render player's duns and hand with stacked cards
    renderStackedCards(headDunContainer, head, 'head', selected.cards, onCardClickSSS, onDropCardSSS, { isDraggable: isReady });
    renderStackedCards(middleDunContainer, middle, 'middle', selected.cards, onCardClickSSS, onDropCardSSS, { isDraggable: isReady });
    renderStackedCards(tailDunContainer, tail, 'tail', selected.cards, onCardClickSSS, onDropCardSSS, { isDraggable: isReady });
    renderStackedCards(handContainer, hand, 'hand', selected.cards, onCardClickSSS, onDropCardSSS, { isDraggable: isReady });

    // Update dun labels with card count
    document.querySelector('#front-dun .dun-label').textContent = `头道 (${head.length})`;
    document.querySelector('#middle-dun .dun-label').textContent = `中道 (${middle.length})`;
    document.querySelector('#back-dun .dun-label').textContent = `尾道 (${tail.length})`;

    // Update message area
    const msgEl = document.getElementById('sss-message');
    if (msgEl) msgEl.textContent = thirteenWaterGameState.message;

    // Update button states
    const autoGroupBtn = document.getElementById('auto-group-btn');
    const compareBtn = document.getElementById('compare-btn');
    if (autoGroupBtn) autoGroupBtn.disabled = !isReady;
    if (compareBtn) {
        const totalCardsInDuns = head.length + middle.length + tail.length;
        const allAIReady = thirteenWaterGameState.aiProcessed.every(p => p);
        compareBtn.disabled = !(isReady && totalCardsInDuns === 13 && allAIReady);
    }
}

function handleReadyClick() {
    const readyBtn = document.getElementById('ready-btn');
    if (!thirteenWaterGameState.isReady) {
        // --- Player is getting ready ---
        thirteenWaterGameState.isReady = true;
        readyBtn.textContent = '取消准备';

        currentGame.startGame(); // Deals cards internally
        const myHand = currentGame.players[0].hand;
        
        // **FIX**: All cards go to the hand initially. Duns are empty.
        thirteenWaterGameState.hand = myHand;
        thirteenWaterGameState.head = [];
        thirteenWaterGameState.middle = [];
        thirteenWaterGameState.tail = [];
        
        // AI processing
        thirteenWaterGameState.aiProcessed = [false, false, false];
        currentGame.players.slice(1).forEach((aiPlayer, idx) => {
            setTimeout(() => {
                currentGame.autoGroup(aiPlayer.id);
                thirteenWaterGameState.aiProcessed[idx] = true;
                const aiSeat = document.querySelector(`#seat-${aiPlayer.id} .status`);
                if (aiSeat) aiSeat.textContent = '已理牌';
                document.querySelector(`#seat-${aiPlayer.id}`).classList.add('processed');
                renderThirteenWaterUI(); // Re-render to update compare button state
            }, 500 + idx * 300);
        });

    } else {
        // --- Player is canceling ---
        thirteenWaterGameState.isReady = false;
        readyBtn.textContent = '准备';
        initializeThirteenWaterState(); // Reset state
    }
    renderThirteenWaterUI();
}

function onCardClickSSS(card, areaId) {
    let { selected } = thirteenWaterGameState;

    if (selected.area !== areaId) {
        // New area selected, select just this card
        selected = { area: areaId, cards: [card] };
    } else {
        // Same area, toggle selection
        const isSelected = selected.cards.some(c => c.id === card.id);
        if (isSelected) {
            selected.cards = selected.cards.filter(c => c.id !== card.id);
        } else {
            selected.cards.push(card);
        }
    }
    thirteenWaterGameState.selected = selected;
    renderThirteenWaterUI(); // Re-render to show selection
}

function onDropCardSSS(cardId, sourceAreaId, targetAreaId) {
    if (sourceAreaId === targetAreaId) return;

    let { hand, head, middle, tail, selected } = thirteenWaterGameState;
    let cardToMove;

    // Find and remove card from source
    const removeFrom = (arr, id) => {
        const index = arr.findIndex(c => c.id === id);
        if (index > -1) {
            cardToMove = arr[index];
            return arr.filter(c => c.id !== id);
        }
        return arr;
    };
    
    if (sourceAreaId === 'hand') hand = removeFrom(hand, cardId);
    else if (sourceAreaId === 'head') head = removeFrom(head, cardId);
    else if (sourceAreaId === 'middle') middle = removeFrom(middle, cardId);
    else if (sourceAreaId === 'tail') tail = removeFrom(tail, cardId);

    // Add card to target
    if (cardToMove) {
        if (targetAreaId === 'hand') hand.push(cardToMove);
        else if (targetAreaId === 'head') head.push(cardToMove);
        else if (targetAreaId === 'middle') middle.push(cardToMove);
        else if (targetAreaId === 'tail') tail.push(cardToMove);
    }
    
    // Update state
    thirteenWaterGameState = { ...thirteenWaterGameState, hand, head, middle, tail, selected: { area: '', cards: [] } };
    renderThirteenWaterUI();
}

function autoGroupAndRender() {
    if (!thirteenWaterGameState.isReady) return;
    
    currentGame.autoGroup('player-0');
    const player = currentGame.players[0];
    
    thirteenWaterGameState.head = player.groups[0];
    thirteenWaterGameState.middle = player.groups[1];
    thirteenWaterGameState.tail = player.groups[2];
    thirteenWaterGameState.hand = []; // All cards are in duns now

    renderThirteenWaterUI();
}

function compareThirteenWater() {
    // Logic to be implemented or adapted
    // alert("比牌逻辑待实现！");
    const player = currentGame.players[0];
    player.groups = [thirteenWaterGameState.head, thirteenWaterGameState.middle, thirteenWaterGameState.tail];

    const results = currentGame.compareAll();
    const resultsArea = document.getElementById('thirteen-water-results');
    resultsArea.style.display = 'flex';
    
    resultsArea.innerHTML = results.map(res => {
        let content;
        if (res.specialType) {
            content = `<div class="special-type-display">${res.specialType.name}</div>`;
        } else {
            content = res.groups.map(g => {
                const cardsHtml = g.cards.map(c => `<img src="/assets/cards/${c.id}" alt="${c.fullName}" class="card-img-small">`).join('');
                return `<div class="dun-display">${cardsHtml}</div>`;
            }).join('');
        }
        return `
            <div class="player-result">
                <div class="score-info">${res.name} (${res.score > 0 ? '+' : ''}${res.score}分)</div>
                ${content}
            </div>`;
    }).join('');

    setTimeout(() => {
        resultsArea.style.display = 'none'; // Hide after a while
        showLobby();
    }, 5000);
}


// --- Common UI Functions ---
function updatePlayerStatus(playerId, text, isYou = false) {
    if (isYou) {
        let indicator = document.querySelector('.bidding-status-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'bidding-status-indicator';
            const container = document.querySelector('.player-area.bottom-player');
            if(container) container.appendChild(indicator);
        }
        if(indicator) indicator.textContent = text;
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

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', showLobby);
