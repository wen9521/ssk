// --- 模块导入 ---
import { renderLobby } from './src/components/lobby.js';
import { playSound, stopSound } from './src/services/audio-service.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand, updateCardCount, renderPlayedCards, renderStackedCards } from './src/components/card.js';
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';
import { renderBiddingControls } from './src/components/bidding-ui.js';
import { ThirteenWaterGame, getHandType, isFoul } from './src/game-logic/thirteen-water-rules.js';
import { renderThirteenWaterBoard } from './src/components/thirteen-water-ui.js';

// --- 全局变量 ---
const app = document.getElementById('app');
let currentGame = null;

// 全局状态
let thirteenWaterGameState = {};

// --- Native Interface ---
const NativeBridge = {
    isAndroid: () => typeof window.Android !== 'undefined',
    setLandscape: () => NativeBridge.isAndroid() && window.Android.setOrientationToLandscape(),
    setPortrait: () => NativeBridge.isAndroid() && window.Android.setOrientationToPortrait()
};

// --- 游戏流程管理 ---
function showLobby() {
    NativeBridge.setPortrait();
    stopSound('bg', { game: 'doudizhu' });
    stopSound('background', { game: 'thirteen-water' });
    document.body.className = 'lobby-bg';
    app.innerHTML = renderLobby();
    document.querySelectorAll('.game-card').forEach(card => {
        const gameId = card.dataset.game;
        card.querySelector('.lobby-btn.trial')?.addEventListener('click', () => {
            // 斗地主和大厅的启动音效都是 'start'
            playSound('start', { game: 'doudizhu' }); 
            startGame(gameId, 'offline');
        });
    });
}

function startGame(gameId, mode) {
    if (mode === 'online') {
        alert('在线匹配模式正在开发中！');
        return;
    }
    document.body.className = gameId === 'doudizhu' ? 'doudizhu-bg' : 'sss-bg';
    if (gameId === 'doudizhu') {
        NativeBridge.setLandscape();
        startDoudizhuOffline();
    } else if (gameId === 'thirteen-water') {
        NativeBridge.setPortrait();
        playSound('background', { game: 'thirteen-water', loop: true, volume: 0.4 });
        startThirteenWaterOffline();
    } else {
        alert('该游戏暂未开放！');
    }
}

// --- 斗地主游戏逻辑 ---
function playDoudizhuSound(soundName) {
    playSound(soundName, { game: 'doudizhu' });
}

function playCardEffects(cardType) {
    if (!cardType || !cardType.type) return;
    // 这里使用斗地主特有的音效文件名
    const soundMap = {
        'bomb': 'bomb', 
        'rocket': 'rocket', 
        'airplane': 'airplane',
        'straight': 'shunzi', // 假设顺子音效文件名是 shunzi.mp3
        'pair': 'duizi', // 对子音效
        'single': 'fapai' // 单张音效，通用发牌音效
    };
    if (soundMap[cardType.type]) {
        playDoudizhuSound(soundMap[cardType.type]);
    }
    const playedArea = document.getElementById('played-cards-area');
    if (playedArea) {
        playedArea.classList.add('effect-flash');
        setTimeout(() => playedArea.classList.remove('effect-flash'), 700);
    }
}

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
    playSound('bg', { game: 'doudizhu', loop: true, volume: 0.3 });
    biddingLoop();
}

function endDoudizhuGame(winner) {
    stopSound('bg', { game: 'doudizhu' });
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

// --- 十三水游戏逻辑 ---
function playSSSsound(soundName) {
    playSound(soundName, { game: 'thirteen-water' });
}

function handleSSSCompare() {
    playSSSsound('compare');
    const player = currentGame.getPlayerById('player-0');
    player.groups = [thirteenWaterGameState.head, thirteenWaterGameState.middle, thirteenWaterGameState.tail];
    
    const comparisonResults = currentGame.compareAll();
    thirteenWaterGameState.hasCompared = true;

    const modalOverlay = document.getElementById('thirteen-water-results');
    const modalContent = modalOverlay.querySelector('.sss-result-modal');
    
    let specialResultsHTML = '';
    // 检查打枪和全垒打
    comparisonResults.forEach(res => {
        if(res.specialScores.isGunner) {
            playSSSsound('gunshot'); // 打枪音效
            specialResultsHTML += `<div class="special-result gun">恭喜！您打枪了 ${res.specialScores.gunTargets.join(', ')}!</div>`;
        }
        if(res.specialScores.isGrandSlam) {
            playSSSsound('win'); // 全垒打音效，或单独的胜利音效
            specialResultsHTML += `<div class="special-result slam">全垒打！您横扫了所有玩家！</div>`;
        }
        if(res.isFoul) {
            // 可以播放一个倒水音效
        }
    });

    const resultsHtml = comparisonResults.map(res => {
        const isMe = res.name === '您';
        const dunCards = isMe ? player.groups : currentGame.getPlayerById(res.playerId).groups;
        
        return `
            <div class="result-player-box">
                <div class="name ${isMe ? 'me' : ''}">
                    ${res.name} (${res.totalScore > 0 ? '+' : ''}${res.totalScore}分)
                    ${res.isFoul ? '<span class="foul-tag">(倒水)</span>' : ''}
                </div>
                ${dunCards.map(dun => `
                    <div class="dun-row">
                        <div class="dun-type-label">${getHandType(dun).name}</div>
                        <div class="dun-cards">
                           ${dun.map(c => `<img src="/assets/cards/${c.id}.svg" class="card">`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
    
    modalContent.innerHTML = `<button class="close-btn">&times;</button>${specialResultsHTML}<div class="result-grid">${resultsHtml}</div>`;
    modalOverlay.classList.add('visible');

    modalContent.querySelector('.close-btn').addEventListener('click', () => {
        modalOverlay.classList.remove('visible');
        showLobby(); // 比牌结束后返回大厅
    });
}

function handleSSSReadyClick() {
    if (thirteenWaterGameState.isReady) {
        initializeThirteenWaterState();
    } else {
        playSSSsound('game-start');
        thirteenWaterGameState.isReady = true;
        currentGame.startGame();
        const player = currentGame.getPlayerById('player-0');
        const splits = currentGame.getAllSmartSplits(player.id);
        thirteenWaterGameState.smartSplits = splits;
        thirteenWaterGameState.currentSplitIndex = 0;
        
        const firstSplit = splits[0];
        thirteenWaterGameState.head = firstSplit.head;
        thirteenWaterGameState.middle = firstSplit.middle;
        thirteenWaterGameState.tail = firstSplit.tail;
        
        thirteenWaterGameState.aiProcessed = [false, false, false];
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

// --- 完整的函数定义 (已在之前提供，此处为简化而省略) ---
function initializeThirteenWaterState() {
    thirteenWaterGameState = { isReady: false, hasCompared: false, head: [], middle: [], tail: [], smartSplits: [], currentSplitIndex: 0, aiProcessed: [false, false, false], message: '' };
}
function startThirteenWaterOffline() {
    initializeThirteenWaterState();
    currentGame = new ThirteenWaterGame(['您', '小明', '小红', '小刚']);
    app.innerHTML = renderThirteenWaterBoard(currentGame.players);
    document.getElementById('exit-sss-btn').addEventListener('click', showLobby);
    document.getElementById('ready-btn').addEventListener('click', handleSSSReadyClick);
    document.getElementById('auto-group-btn').addEventListener('click', handleSSSAutoGroup);
    document.getElementById('compare-btn').addEventListener('click', handleSSSCompare);
    const mainPanel = document.querySelector('.sss-main-panel');
    if (mainPanel) { mainPanel.addEventListener('dragstart', handleDragStart); }
    ['front-dun', 'middle-dun', 'back-dun'].forEach(id => {
        const dunArea = document.getElementById(id);
        if (dunArea) { dunArea.addEventListener('dragover', handleDragOver); dunArea.addEventListener('dragleave', handleDragLeave); dunArea.addEventListener('drop', handleDrop); }
    });
    renderThirteenWaterUI();
}
function handleDragStart(e) { if (!e.target.classList.contains('card') || !thirteenWaterGameState.isReady) { e.preventDefault(); return; } e.dataTransfer.setData('text/plain', e.target.dataset.cardId); e.dataTransfer.setData('source-area', e.target.dataset.area); setTimeout(() => e.target.classList.add('dragging'), 0); }
function handleDragOver(e) { e.preventDefault(); const dropTarget = e.currentTarget; if (dropTarget.classList.contains('sss-dun-area')) { dropTarget.classList.add('drag-over'); } }
function handleDragLeave(e) { const dropTarget = e.currentTarget; if (dropTarget.classList.contains('sss-dun-area')) { dropTarget.classList.remove('drag-over'); } }
function handleDrop(e) { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); const cardId = e.dataTransfer.getData('text/plain'); const sourceArea = e.dataTransfer.getData('source-area'); const targetArea = e.currentTarget.id.split('-')[0]; if (!cardId || sourceArea === targetArea) return; let cardToMove; const sourceArray = thirteenWaterGameState[sourceArea]; const cardIndex = sourceArray.findIndex(c => c.id === cardId); if (cardIndex > -1) { cardToMove = sourceArray.splice(cardIndex, 1)[0]; thirteenWaterGameState[targetArea].push(cardToMove); renderThirteenWaterUI(); } }
function renderThirteenWaterUI() { if (!document.querySelector('.sss-game-container')) return; const { head, middle, tail, isReady, hasCompared, aiProcessed, message } = thirteenWaterGameState; const isPlayerFoul = isReady && isFoul(head, middle, tail); renderSSSDun('front-dun', head, 'head', isReady, isPlayerFoul); renderSSSDun('middle-dun', middle, 'middle', isReady, isPlayerFoul); renderSSSDun('back-dun', tail, 'tail', isReady, isPlayerFoul); const readyBtn = document.getElementById('ready-btn'); const autoGroupBtn = document.getElementById('auto-group-btn'); const compareBtn = document.getElementById('compare-btn'); if (readyBtn) { readyBtn.textContent = isReady ? '取消准备' : '准备'; readyBtn.classList.toggle('ready', isReady); readyBtn.disabled = hasCompared; } if (autoGroupBtn) autoGroupBtn.disabled = !isReady || hasCompared; if (compareBtn) { const allCardsPlaced = head.length + middle.length + tail.length === 13; const allAiReady = aiProcessed.every(p => p); compareBtn.disabled = !isReady || hasCompared || !allCardsPlaced || !allAiReady || isPlayerFoul; } const msgEl = document.getElementById('sss-message'); if (msgEl) { msgEl.textContent = isPlayerFoul ? "警告：牌型倒水！" : message; msgEl.style.color = isPlayerFoul ? 'var(--sss-foul-red)' : 'var(--sss-text-light)'; } currentGame.players.slice(1).forEach((ai, idx) => { const seatEl = document.getElementById(ai.id); if (seatEl) { const statusEl = seatEl.querySelector('.status'); seatEl.classList.toggle('processed', aiProcessed[idx]); if (statusEl) statusEl.textContent = aiProcessed[idx] ? '已理牌' : '理牌中...'; } }); }
function renderSSSDun(dunId, cards, areaName, isEnabled, isFoul) { const dunEl = document.getElementById(dunId); if (!dunEl) return; const cardArea = dunEl.querySelector('.card-display-area'); const label = dunEl.querySelector('.dun-label'); const handType = getHandType(cards); const maxCards = { head: 3, middle: 5, tail: 5 }[areaName]; const areaDisplayName = {head: '头道', middle: '中道', tail: '尾道'}[areaName]; label.innerHTML = `${areaDisplayName} (${cards.length}/${maxCards}) <span class="hand-type">${handType.name}</span>`; label.style.color = isFoul ? 'var(--sss-foul-red)' : 'var(--sss-accent-main)'; cardArea.classList.toggle('empty-dun', cards.length === 0); const cardWidth = 77; const maxWidth = cardArea.offsetWidth - 70; let overlap = Math.floor(cardWidth / 1.8); if (cards.length > 1) { const totalWidth = cardWidth + (cards.length - 1) * overlap; if (totalWidth > maxWidth) { overlap = Math.floor((maxWidth - cardWidth) / (cards.length - 1)); } } cardArea.innerHTML = cards.sort((a,b) => a.rank - b.rank).map((card, idx) => { const left = idx * overlap; return `<img src="/assets/cards/${card.id}.svg" alt="${card.fullName}" class="card" style="left: ${left}px; z-index: ${idx};" data-card-id="${card.id}" data-area="${areaName}" draggable="${isEnabled}">`; }).join(''); }
function handleSSSAutoGroup() { if (!thirteenWaterGameState.isReady) return; const { smartSplits } = thirteenWaterGameState; const nextIndex = (thirteenWaterGameState.currentSplitIndex + 1) % smartSplits.length; const nextSplit = smartSplits[nextIndex]; thirteenWaterGameState.head = nextSplit.head; thirteenWaterGameState.middle = nextSplit.middle; thirteenWaterGameState.tail = nextSplit.tail; thirteenWaterGameState.currentSplitIndex = nextIndex; const overallType = getHandType(nextSplit.head).name + " | " + getHandType(nextSplit.middle).name + " | " + getHandType(nextSplit.tail).name; thirteenWaterGameState.message = `智能方案 ${nextIndex + 1}/${smartSplits.length}: ${overallType}`; renderThirteenWaterUI(); }
function biddingLoop() { if (currentGame.gameState !== 'bidding') { finalizeDoudizhuBoard(); return; } const currentPlayer = currentGame.getCurrentBiddingPlayer(); updateUITurn(currentPlayer, 'bidding'); if (currentPlayer.id === 'player-0') { const container = document.querySelector('.action-btns'); if (container) { container.innerHTML = renderBiddingControls(currentGame.highestBid);
            // Correctly attach listener to the bidding container after it's rendered
            const biddingContainer = document.getElementById('bidding-container');
            if (biddingContainer) { biddingContainer.addEventListener('click', handleDoudizhuBidClick); }
        } } else { updatePlayerStatus(currentPlayer.id, '思考中...'); setTimeout(() => { const bid = currentGame.aiSimpleBid(currentPlayer.id); currentGame.playerBid(currentPlayer.id, bid); const bidText = bid > currentGame.highestBid ? `${bid}分` : '不叫'; updatePlayerStatus(currentPlayer.id, bidText); biddingLoop(); }, 1500); } }
function handleDoudizhuBidClick(event) { const button = event.target.closest('button'); if (!button || button.disabled) return; const bid = parseInt(button.dataset.bid, 10); currentGame.playerBid('player-0', bid); const container = document.querySelector('.action-btns'); if (container) container.innerHTML = ''; updatePlayerStatus('player-0', bid > 0 ? `${bid}分` : '不叫', true); setTimeout(biddingLoop, 100); }
function finalizeDoudizhuBoard() { const landlord = currentGame.players.find(p => p.isLandlord); if (!landlord) { alert('流局，无人叫地主！即将重新发牌。'); startDoudizhuOffline(); return; } highlightLandlord(); document.querySelector(`#${landlord.id} .name`).innerHTML += ' (地主)'; renderPlayedCards('landlord-cards-area', currentGame.landlordCards); currentGame.players.forEach(p => { const handContainer = document.getElementById(`hand-${p.id}`); if(handContainer) renderPlayerHand(handContainer.id, p.hand, p.id !== 'player-0'); updateCardCount(p.id, p.hand.length); }); updateMultiplierDisplay(currentGame.multiplier); const container = document.querySelector('.action-btns'); if (container) { container.innerHTML = `<button id="pass-btn" class="action-btn pass" disabled>不要</button><button id="play-btn" class="action-btn play" disabled>出牌</button>`; document.getElementById('play-btn').addEventListener('click', handleDoudizhuPlay); document.getElementById('pass-btn').addEventListener('click', handleDoudizhuPass); } doudizhuGameLoop(); }
function doudizhuGameLoop() { if (currentGame.gameState === 'ended') { endDoudizhuGame(currentGame.getWinner()); return; } const currentPlayer = currentGame.getCurrentPlayingPlayer(); updateUITurn(currentPlayer, 'playing'); if (currentPlayer.id !== 'player-0') setTimeout(doudizhuAiTurn, 1200); }
function handleDoudizhuPlay() { const selected = document.querySelectorAll('#hand-player-0 .card.selected'); if (selected.length === 0) return; const cardIds = Array.from(selected).map(el => el.dataset.cardId); const result = currentGame.playCards('player-0', cardIds); if (result) { playCardEffects(result.cardType); renderPlayedCards('played-cards-area', result.playedCards); renderPlayerHand('hand-player-0', currentGame.getPlayerById('player-0').hand, false); updateCardCount('player-0', currentGame.getPlayerById('player-0').hand.length); updatePlayerStatus('player-0', '', true); doudizhuGameLoop(); } else { alert("出牌不符合规则！"); } }
function handleDoudizhuPass() { if (currentGame.passTurn('player-0')) { updatePlayerStatus('player-0', '不要', true); doudizhuGameLoop(); } else { alert("轮到你首次出牌，不能不要！"); } }
function doudizhuAiTurn() { const aiPlayer = currentGame.getCurrentPlayingPlayer(); const result = currentGame.aiSimplePlay(aiPlayer.id); if (result && result.playedCards) { playCardEffects(result.cardType); renderPlayedCards('played-cards-area', result.playedCards); updatePlayerStatus(aiPlayer.id, ''); } else { updatePlayerStatus(aiPlayer.id, '不要'); } updateCardCount(aiPlayer.id, aiPlayer.hand.length); doudizhuGameLoop(); }
function updatePlayerStatus(playerId, text, isYou = false) { const statusEl = document.getElementById(`status-${playerId}`); if (statusEl && document.querySelector('.ddz-mobile-table')) { statusEl.textContent = text; statusEl.style.display = text ? 'block' : 'none'; if (isYou && text) { setTimeout(() => { statusEl.style.display = 'none'; }, 1200); } } }
function updateUITurn(player, phase) { if (document.querySelector('.ddz-mobile-table')) { document.querySelectorAll('.player-ai, .player-me').forEach(el => el.style.boxShadow = 'none'); const playerEl = document.getElementById(player.id); if(playerEl) playerEl.style.boxShadow = '0 0 25px var(--accent-color)'; if (phase === 'playing' && document.getElementById('play-btn')) { const isMyTurn = player.id === 'player-0'; const canPass = currentGame.lastValidPlay.playerId && currentGame.passPlayCount < currentGame.players.length - 1; document.getElementById('play-btn').disabled = !isMyTurn; document.getElementById('pass-btn').disabled = !isMyTurn || !canPass; } } }
function highlightLandlord() { const landlord = currentGame.players.find(p => p.isLandlord); document.querySelectorAll('.player-ai, .player-me').forEach(el => el.classList.remove('landlord')); if (landlord) { const el = document.getElementById(landlord.id); if (el) el.classList.add('landlord'); } }
function updateMultiplierDisplay(multiplier) { let el = document.getElementById('multiplier-indicator'); if (el) { el.textContent = `倍数: x${multiplier}`; el.classList.add('multiplier-flash'); setTimeout(()=>el.classList.remove('multiplier-flash'), 800); } }
