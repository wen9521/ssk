// --- 模块导入 ---
import { renderLobby } from './src/components/lobby.js';
import { playSound, stopSound } from './src/services/audio-service.js';
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
    stopSound('background', { game: 'thirteen-water' });
    document.body.className = 'lobby-bg';
    app.innerHTML = renderLobby();
    document.querySelectorAll('.game-card').forEach(card => {
        const gameId = card.dataset.game;
        card.querySelector('.lobby-btn.trial')?.addEventListener('click', () => {
            startGame(gameId, 'offline');
        });
    });
}

function startGame(gameId, mode) {
    if (mode === 'online') {
        alert('在线匹配模式正在开发中！');
        return;
    }
    document.body.className = 'sss-bg';
    if (gameId === 'thirteen-water') {
        NativeBridge.setPortrait();
        playSound('background', { game: 'thirteen-water', loop: true, volume: 0.4 });
        startThirteenWaterOffline();
    } else {
        alert('该游戏暂未开放！');
    }
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
                           ${dun.map(c => `<img src="assets/cards/${c.id}.svg" class="card">`).join('')}
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
function renderSSSDun(dunId, cards, areaName, isEnabled, isFoul) { const dunEl = document.getElementById(dunId); if (!dunEl) return; const cardArea = dunEl.querySelector('.card-display-area'); const label = dunEl.querySelector('.dun-label'); const handType = getHandType(cards); const maxCards = { head: 3, middle: 5, tail: 5 }[areaName]; const areaDisplayName = {head: '头道', middle: '中道', tail: '尾道'}[areaName]; label.innerHTML = `${areaDisplayName} (${cards.length}/${maxCards}) <span class="hand-type">${handType.name}</span>`; label.style.color = isFoul ? 'var(--sss-foul-red)' : 'var(--sss-accent-main)'; cardArea.classList.toggle('empty-dun', cards.length === 0); const cardWidth = 77; const maxWidth = cardArea.offsetWidth - 70; let overlap = Math.floor(cardWidth / 1.8); if (cards.length > 1) { const totalWidth = cardWidth + (cards.length - 1) * overlap; if (totalWidth > maxWidth) { overlap = Math.floor((maxWidth - cardWidth) / (cards.length - 1)); } } cardArea.innerHTML = cards.sort((a,b) => a.rank - b.rank).map((card, idx) => { const left = idx * overlap; return `<img src="assets/cards/${card.id}.svg" alt="${card.fullName}" class="card" style="left: ${left}px; z-index: ${idx};" data-card-id="${card.id}" data-area="${areaName}" draggable="${isEnabled}">`; }).join(''); }
function handleSSSAutoGroup() { if (!thirteenWaterGameState.isReady) return; const { smartSplits } = thirteenWaterGameState; const nextIndex = (thirteenWaterGameState.currentSplitIndex + 1) % smartSplits.length; const nextSplit = smartSplits[nextIndex]; thirteenWaterGameState.head = nextSplit.head; thirteenWaterGameState.middle = nextSplit.middle; thirteenWaterGameState.tail = nextSplit.tail; thirteenWaterGameState.currentSplitIndex = nextIndex; const overallType = getHandType(nextSplit.head).name + " | " + getHandType(nextSplit.middle).name + " | " + getHandType(nextSplit.tail).name; thirteenWaterGameState.message = `智能方案 ${nextIndex + 1}/${smartSplits.length}: ${overallType}`; renderThirteenWaterUI(); }

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', showLobby);
