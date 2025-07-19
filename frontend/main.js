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

// 全局状态
let thirteenWaterGameState = {};

// --- 斗地主游戏逻辑 (已完成) ---
// ... (斗地主相关函数保持不变) ...

// --- 游戏流程管理 ---
function showLobby() {
    stopSound('doudizhu-bgMusic');
    stopSound('thirteen-water-bgMusic');
    document.body.className = 'lobby-bg';
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
        document.body.className = 'doudizhu-bg';
        startDoudizhuOffline();
    } else if (gameId === 'thirteen-water') {
        document.body.className = 'sss-bg';
        playSound('thirteen-water-bgMusic', { loop: true, volume: 0.4 });
        startThirteenWaterOffline();
    } else {
        alert('该游戏暂未开放！');
    }
}

// --- 十三水游戏逻辑 (重构后) ---
function initializeThirteenWaterState() {
    thirteenWaterGameState = {
        isReady: false,
        hasCompared: false,
        hand: [], // 存储尚未放入牌墩的牌
        head: [],
        middle: [],
        tail: [],
        selected: { area: '', cards: [] }, // area: 'hand', 'head', 'middle', 'tail'
        aiProcessed: [false, false, false],
        message: ''
    };
}

function startThirteenWaterOffline() {
    initializeThirteenWaterState();
    currentGame = new ThirteenWaterGame(['您', '小明', '小红', '小刚']);
    app.innerHTML = renderThirteenWaterBoard(currentGame.players);

    // 绑定事件监听器
    document.getElementById('exit-sss-btn').addEventListener('click', showLobby);
    document.getElementById('ready-btn').addEventListener('click', handleSSSReadyClick);
    document.getElementById('auto-group-btn').addEventListener('click', handleSSSAutoGroup);
    document.getElementById('compare-btn').addEventListener('click', handleSSSCompare);
    
    // 为三个牌墩区域添加点击事件，用于移动选中的牌
    document.getElementById('front-dun').addEventListener('click', () => handleDunClick('head'));
    document.getElementById('middle-dun').addEventListener('click', () => handleDunClick('middle'));
    document.getElementById('back-dun').addEventListener('click', () => handleDunClick('tail'));

    renderThirteenWaterUI();
}

// 渲染整个十三水UI的函数
function renderThirteenWaterUI() {
    if (!document.querySelector('.sss-game-container')) return; // 如果UI已卸载则不执行

    const { head, middle, tail, selected, isReady, hasCompared, aiProcessed, message } = thirteenWaterGameState;

    // 渲染三个牌墩
    renderSSSDun('front-dun', head, 'head', selected, isReady);
    renderSSSDun('middle-dun', middle, 'middle', selected, isReady);
    renderSSSDun('back-dun', tail, 'tail', selected, isReady);
    
    // 渲染手牌区域（未使用，所有牌直接进入牌墩）
    // 在这个版本里，所有牌都在牌墩里，没有额外的手牌区
    const myHandArea = document.getElementById('player-hand-area');
    if (myHandArea) myHandArea.innerHTML = ''; // 保证手牌区为空

    // 更新按钮状态
    const readyBtn = document.getElementById('ready-btn');
    const autoGroupBtn = document.getElementById('auto-group-btn');
    const compareBtn = document.getElementById('compare-btn');

    if (readyBtn) {
        readyBtn.textContent = isReady ? '取消准备' : '准备';
        readyBtn.classList.toggle('ready', isReady);
        readyBtn.disabled = hasCompared;
    }
    if (autoGroupBtn) autoGroupBtn.disabled = !isReady || hasCompared;
    if (compareBtn) {
        const allCardsPlaced = head.length + middle.length + tail.length === 13;
        const allAiReady = aiProcessed.every(p => p);
        compareBtn.disabled = !isReady || hasCompared || !allCardsPlaced || !allAiReady;
    }
    
    // 更新消息区
    const msgEl = document.getElementById('sss-message');
    if (msgEl) msgEl.textContent = message;
    
    // 更新AI玩家状态
    currentGame.players.slice(1).forEach((ai, idx) => {
        const seatEl = document.getElementById(ai.id);
        if (seatEl) {
            const statusEl = seatEl.querySelector('.status');
            seatEl.classList.toggle('processed', aiProcessed[idx]);
            if (statusEl) statusEl.textContent = aiProcessed[idx] ? '已理牌' : '理牌中...';
        }
    });
}

// 渲染单个牌墩
function renderSSSDun(dunId, cards, areaName, selected, isEnabled) {
    const dunEl = document.getElementById(dunId);
    if (!dunEl) return;
    const cardArea = dunEl.querySelector('.card-display-area');
    const label = dunEl.querySelector('.dun-label');
    const maxCards = { head: 3, middle: 5, tail: 5 }[areaName];
    
    cardArea.classList.toggle('empty-dun', cards.length === 0);
    label.textContent = `${{head: '头道', middle: '中道', tail: '尾道'}[areaName]} (${cards.length}/${maxCards})`;
    
    // 动态计算卡牌重叠
    const cardWidth = 77;
    const maxWidth = cardArea.offsetWidth - 70; // 减去右侧标签宽度
    let overlap = Math.floor(cardWidth / 2);
    if (cards.length > 1) {
        const totalWidth = cardWidth + (cards.length - 1) * overlap;
        if (totalWidth > maxWidth) {
            overlap = Math.floor((maxWidth - cardWidth) / (cards.length - 1));
        }
    }

    cardArea.innerHTML = cards.map((card, idx) => {
        const isSelected = selected.area === areaName && selected.cards.includes(card.id);
        const left = idx * overlap;
        return `<img src="/assets/cards/${card.id}.svg" 
                     alt="${card.fullName}"
                     class="card ${isSelected ? 'selected' : ''}"
                     style="left: ${left}px; z-index: ${idx};"
                     data-card-id="${card.id}"
                     data-area="${areaName}"
                     ${isEnabled ? '' : 'disabled'}>`;
    }).join('');

    // 为每张卡牌添加点击事件
    cardArea.querySelectorAll('.card').forEach(cardEl => {
        cardEl.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止触发牌墩的点击事件
            if (!isEnabled) return;
            const cardId = e.target.dataset.cardId;
            const area = e.target.dataset.area;
            handleSSSCardClick(cardId, area);
        });
    });
}

function handleSSSReadyClick() {
    if (thirteenWaterGameState.isReady) {
        // 取消准备
        initializeThirteenWaterState();
    } else {
        // 准备
        thirteenWaterGameState.isReady = true;
        currentGame.startGame();
        const myHand = currentGame.getPlayerById('player-0').hand;
        
        // 初始默认分牌
        thirteenWaterGameState.head = myHand.slice(0, 3);
        thirteenWaterGameState.middle = myHand.slice(3, 8);
        thirteenWaterGameState.tail = myHand.slice(8, 13);
        
        // AI 异步理牌
        currentGame.players.slice(1).forEach((aiPlayer, idx) => {
            setTimeout(() => {
                currentGame.autoGroup(aiPlayer.id);
                thirteenWaterGameState.aiProcessed[idx] = true;
                renderThirteenWaterUI();
            }, 500 + idx * 300);
        });
    }
    renderThirteenWaterUI();
}

function handleSSSCardClick(cardId, area) {
    let { selected } = thirteenWaterGameState;
    // 如果点击了不同区域的牌，则重置选择
    if (selected.area !== area) {
        selected = { area, cards: [cardId] };
    } else {
        // 否则，在当前区域内切换选择
        const isSelected = selected.cards.includes(cardId);
        if (isSelected) {
            selected.cards = selected.cards.filter(id => id !== cardId);
        } else {
            selected.cards.push(cardId);
        }
    }
    thirteenWaterGameState.selected = selected;
    renderThirteenWaterUI();
}

function handleDunClick(targetArea) {
    let { selected, head, middle, tail } = thirteenWaterGameState;
    if (!selected.cards.length || selected.area === targetArea) return;

    const sourceArea = selected.area;
    const cardsToMoveIds = selected.cards;

    // 从源牌墩移除
    let movedCards = [];
    const removeFrom = (cardArray) => {
        const remaining = [];
        for (const card of cardArray) {
            if (cardsToMoveIds.includes(card.id)) {
                movedCards.push(card);
            } else {
                remaining.push(card);
            }
        }
        return remaining;
    }
    
    if (sourceArea === 'head') head = removeFrom(head);
    else if (sourceArea === 'middle') middle = removeFrom(middle);
    else if (sourceArea === 'tail') tail = removeFrom(tail);

    // 添加到目标牌墩
    if (targetArea === 'head') head.push(...movedCards);
    else if (targetArea === 'middle') middle.push(...movedCards);
    else if (targetArea === 'tail') tail.push(...movedCards);

    // 更新状态
    thirteenWaterGameState.head = head;
    thirteenWaterGameState.middle = middle;
    thirteenWaterGameState.tail = tail;
    thirteenWaterGameState.selected = { area: '', cards: [] }; // 清空选择
    
    renderThirteenWaterUI();
}

function handleSSSAutoGroup() {
    if (!thirteenWaterGameState.isReady) return;
    currentGame.autoGroup('player-0');
    const player = currentGame.getPlayerById('player-0');
    thirteenWaterGameState.head = player.groups[0];
    thirteenWaterGameState.middle = player.groups[1];
    thirteenWaterGameState.tail = player.groups[2];
    thirteenWaterGameState.message = "已使用智能分牌";
    renderThirteenWaterUI();
    setTimeout(() => {
        thirteenWaterGameState.message = "";
        renderThirteenWaterUI();
    }, 1500);
}

function handleSSSCompare() {
    // 将最终牌组存入游戏对象
    const player = currentGame.getPlayerById('player-0');
    player.groups = [thirteenWaterGameState.head, thirteenWaterGameState.middle, thirteenWaterGameState.tail];
    
    const results = currentGame.compareAll();
    thirteenWaterGameState.hasCompared = true;

    const modalOverlay = document.getElementById('thirteen-water-results');
    const modalContent = modalOverlay.querySelector('.sss-result-modal');
    
    const resultsHtml = results.map((res, i) => {
        const isMe = res.name === '您';
        const dunCards = isMe
            ? [thirteenWaterGameState.head, thirteenWaterGameState.middle, thirteenWaterGameState.tail]
            : currentGame.getPlayerById(res.playerId).groups;
        
        return `
            <div class="result-player-box">
                <div class="name ${isMe ? 'me' : ''}">
                    ${res.name} (${res.score > 0 ? '+' : ''}${res.score}分)
                    ${res.isFoul ? '<span class="foul-tag">(倒水)</span>' : ''}
                </div>
                ${dunCards.map(dun => `
                    <div class="dun-row">
                        ${dun.map(c => `<img src="/assets/cards/${c.id}.svg" class="card">`).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
    
    modalContent.innerHTML = `<button class="close-btn">&times;</button>` + resultsHtml;
    modalOverlay.classList.add('visible');

    modalContent.querySelector('.close-btn').addEventListener('click', () => {
        modalOverlay.classList.remove('visible');
        renderThirteenWaterUI(); // 刷新UI以禁用按钮
    });
}


// --- 公共UI函数 ---
// (这部分现在由各个游戏的渲染函数自己处理)
function updatePlayerStatus(playerId, text, isYou = false) {
    // 斗地主专用
    const statusEl = document.getElementById(`status-${playerId}`);
    if (statusEl && document.querySelector('.ddz-mobile-table')) {
        statusEl.textContent = text;
        statusEl.style.display = text ? 'block' : 'none';
        
        if (isYou && text) {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 1200);
        }
    }
}

function updateUITurn(player, phase) {
    // 斗地主专用
    if (document.querySelector('.ddz-mobile-table')) {
        document.querySelectorAll('.player-ai, .player-me').forEach(el => el.style.boxShadow = 'none');
        const playerEl = document.getElementById(player.id);
        if(playerEl) playerEl.style.boxShadow = '0 0 25px var(--accent-color)';
        
        if (phase === 'playing' && document.getElementById('play-btn')) {
            const isMyTurn = player.id === 'player-0';
            const canPass = currentGame.lastValidPlay.playerId && currentGame.passPlayCount < currentGame.players.length - 1;
            document.getElementById('play-btn').disabled = !isMyTurn;
            document.getElementById('pass-btn').disabled = !isMyTurn || !canPass;
        }
    }
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', showLobby);

// --- 斗地主函数的存根 ---
function startDoudizhuOffline() {
    currentGame = new DouDizhuGame(['您', '下家AI', '上家AI']);
    currentGame.startGame();
    app.innerHTML = renderGameBoard(currentGame.players);
    const player = currentGame.getPlayerById('player-0');
    renderPlayerHand(`hand-${player.id}`, player.hand, false);
    currentGame.players.forEach(p => {
        updateCardCount(p.id, p.hand.length);
    });
    document.getElementById('play-btn').addEventListener('click', handleDoudizhuPlay);
    document.getElementById('pass-btn').addEventListener('click', handleDoudizhuPass);
    biddingLoop();
}
function biddingLoop() {
    if (currentGame.gameState !== 'bidding') { finalizeDoudizhuBoard(); return; }
    const currentPlayer = currentGame.getCurrentBiddingPlayer();
    updateUITurn(currentPlayer, 'bidding');
    if (currentPlayer.id === 'player-0') {
        const container = document.querySelector('.action-btns');
        if (container) {
            container.innerHTML = renderBiddingControls(currentGame.highestBid);
            container.querySelector('#bidding-container').addEventListener('click', handleDoudizhuBidClick);
        }
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
    const container = document.querySelector('.action-btns');
    if (container) container.innerHTML = '';
    updatePlayerStatus('player-0', bid > 0 ? `${bid}分` : '不叫', true);
    setTimeout(biddingLoop, 100);
}
function finalizeDoudizhuBoard() {
    const landlord = currentGame.players.find(p => p.isLandlord);
    if (!landlord) { alert('流局，无人叫地主！即将重新发牌。'); startDoudizhuOffline(); return; }
    highlightLandlord();
    document.querySelector(`#${landlord.id} .name`).innerHTML += ' (地主)';
    renderPlayedCards('landlord-cards-area', currentGame.landlordCards);
    currentGame.players.forEach(p => {
        const handContainer = document.getElementById(`hand-${p.id}`);
        if(handContainer) renderPlayerHand(handContainer.id, p.hand, p.id !== 'player-0');
        updateCardCount(p.id, p.hand.length);
    });
    updateMultiplierDisplay(currentGame.multiplier);
    const container = document.querySelector('.action-btns');
    if (container) {
        container.innerHTML = `<button id="pass-btn" class="action-btn pass" disabled>不要</button><button id="play-btn" class="action-btn play" disabled>出牌</button>`;
        document.getElementById('play-btn').addEventListener('click', handleDoudizhuPlay);
        document.getElementById('pass-btn').addEventListener('click', handleDoudizhuPass);
    }
    doudizhuGameLoop();
}
function doudizhuGameLoop() {
    if (currentGame.gameState === 'ended') { endDoudizhuGame(currentGame.getWinner()); return; }
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
        renderPlayerHand('hand-player-0', currentGame.getPlayerById('player-0').hand, false);
        updateCardCount('player-0', currentGame.getPlayerById('player-0').hand.length);
        updatePlayerStatus('player-0', '', true);
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
        if ((winner.isLandlord && currentGame.players.every(p => p.isLandlord || p.playsCount === 0)) || (!winner.isLandlord && currentGame.players.find(p => p.isLandlord).playsCount <= 1)) {
            message += `
(春天或反春 x2)`;
        }
    }
    setTimeout(() => {
        alert(message);
        showLobby();
    }, 1000);
}
function highlightLandlord() {
    const landlord = currentGame.players.find(p => p.isLandlord);
    document.querySelectorAll('.player-ai, .player-me').forEach(el => el.classList.remove('landlord'));
    if (landlord) {
        const el = document.getElementById(landlord.id);
        if (el) el.classList.add('landlord');
    }
}
function playCardEffects(cardType) {
    if (!cardType || !cardType.type) return;
    const soundMap = { 'bomb': 'bomb', 'rocket': 'rocket', 'airplane': 'airplane', 'straight': 'straight' };
    if (soundMap[cardType.type]) playSound(soundMap[cardType.type]);
    const playedArea = document.getElementById('played-cards-area');
    if(playedArea) {
        playedArea.classList.add('effect-flash');
        setTimeout(()=>playedArea.classList.remove('effect-flash'), 700);
    }
}
function updateMultiplierDisplay(multiplier) {
    let el = document.getElementById('multiplier-indicator');
    if (el) {
        el.textContent = `倍数: x${multiplier}`;
        el.classList.add('multiplier-flash');
        setTimeout(()=>el.classList.remove('multiplier-flash'), 800);
    }
}
