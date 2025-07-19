// --- 模块导入 ---
import { renderLobby } from './src/components/lobby.js';
import { playSound, stopSound } from './src/services/audio-service.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand, updateCardCount, renderPlayedCards } from './src/components/card.js';
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';
import { renderBiddingControls } from './src/components/bidding-ui.js';
import { BigTwoGame } from './src/game-logic/big-two-rules.js';
import { renderBigTwoBoard } from './src/components/big-two-ui.js';
import { ThirteenWaterGame } from './src/game-logic/thirteen-water-rules.js';
import { renderThirteenWaterBoard } from './src/components/thirteen-water-ui.js';

// --- 全局变量 ---
const app = document.getElementById('app');
let currentGame = null;

// --- 核心UI更新与特效 ---

function showSpecialEffect(text) {
    const effectDiv = document.createElement('div');
    effectDiv.className = 'special-effect-container';
    effectDiv.textContent = text;
    document.body.appendChild(effectDiv);
    setTimeout(() => {
        effectDiv.remove();
    }, 1500);
}

function playCardEffects(cardType) {
    if (!cardType || !cardType.type) return;

    const type = cardType.type;
    // 播放特定音效
    if (soundMap[type]) {
        playSound(type);
    } else {
        playSound('playCard');
    }

    // 显示特定视觉特效
    if (type === 'bomb') showSpecialEffect('炸弹！');
    if (type === 'rocket') showSpecialEffect('火箭！');
    if (type.includes('airplane')) showSpecialEffect('飞机！');
    if (type === 'straight') showSpecialEffect('顺子！');
}

const soundMap = {
    'trio': 'trio',
    'trio_single': 'trio_single',
    'trio_pair': 'trio_pair',
    'straight': 'straight',
    'pair': 'pair',
    'bomb': 'bomb',
    'rocket': 'rocket',
    'airplane': 'airplane',
    'airplane_singles': 'airplane',
    'airplane_pairs': 'airplane'
};


// --- 游戏流程管理 ---

function showLobby() {
    stopSound('bgMusic');
    app.innerHTML = renderLobby();
    document.querySelectorAll('.game-card').forEach(card => {
        const gameId = card.dataset.game;
        const trialBtn = card.querySelector('.lobby-btn.trial');
        trialBtn?.addEventListener('click', () => {
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
    playSound('bgMusic', { loop: true, volume: 0.3 });
    if (gameId === 'doudizhu') startDoudizhuOffline();
    else alert('该游戏暂未开放！');
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
            const oldBid = currentGame.highestBid;
            currentGame.playerBid(currentPlayer.id, currentGame.aiSimpleBid(currentPlayer.id)); // Use AI logic to get bid
            const newBid = currentGame.highestBid;
            const bidText = newBid > oldBid ? `${newBid}分` : '不叫';
            playSound(newBid > oldBid ? `bid${newBid}` : 'pass');
            updatePlayerStatus(currentPlayer.id, bidText);
            biddingLoop();
        }, 1500);
    }
}

function handleDoudizhuBidClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    
    const bid = parseInt(button.dataset.bid, 10);
    playSound(bid > 0 ? `bid${bid}` : 'pass');
    
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
        endGame(currentGame.getWinner());
        return;
    }
    const currentPlayer = currentGame.getCurrentPlayingPlayer();
    updateUITurn(currentPlayer, 'playing');

    if (currentPlayer.id !== 'player-0') {
        setTimeout(doudizhuAiTurn, 1200);
    }
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
        playSound('pass');
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
        playSound('pass');
        updatePlayerStatus(aiPlayer.id, '不要');
    }
    
    updateCardCount(aiPlayer.id, aiPlayer.hand.length);
    renderPlayerHand(`hand-${aiPlayer.id}`, aiPlayer.hand, true); // AI手牌是隐藏的
    doudizhuGameLoop();
}


function endGame(winner) {
    stopSound('bgMusic');
    const isWinner = winner.id === 'player-0';
    const finalScore = currentGame.baseScore * currentGame.multiplier;

    let message = `游戏结束！
`;
    message += isWinner ? "恭喜你，你赢了！" : `你输了，胜利者是 ${winner.name}。`;
    message += `
底分: ${currentGame.baseScore} x 倍数: ${currentGame.multiplier} = 总分: ${finalScore}`;

    if ((winner.isLandlord && currentGame.players.every(p => p.isLandlord || p.playsCount === 0)) ||
        (!winner.isLandlord && currentGame.players.find(p=>p.isLandlord).playsCount <= 1) ){
        message += "
(春天或反春 x2)";
    }

    setTimeout(() => {
        playSound(isWinner ? 'win' : 'lose');
        alert(message);
        showLobby();
    }, 1000);
}

// --- 通用UI更新 ---
function updatePlayerStatus(playerId, text, isYou = false) {
    if (isYou) {
        const indicator = document.querySelector('.bidding-status-indicator');
        if (indicator) indicator.remove();
        
        const container = document.querySelector('.player-area.bottom-player');
        container.insertAdjacentHTML('beforeend', `<div class="bidding-status-indicator">${text}</div>`);
        setTimeout(() => document.querySelector('.bidding-status-indicator')?.remove(), 1200);
        return;
    }
    
    const statusEl = document.getElementById(`status-${playerId}`);
    if (statusEl) {
        statusEl.textContent = text;
        statusEl.classList.toggle('visible', !!text);
    }
}

function updateUITurn(player, phase) {
    document.querySelectorAll('.player-pod').forEach(el => el.style.boxShadow = 'none');
    document.getElementById(player.id).style.boxShadow = '0 0 25px var(--accent-color)';

    if (phase === 'playing') {
        const isMyTurn = player.id === 'player-0';
        const canPass = currentGame.lastValidPlay.playerId && currentGame.passPlayCount < 2;
        document.getElementById('play-btn').disabled = !isMyTurn;
        document.getElementById('pass-btn').disabled = !isMyTurn || !canPass;
    }
}

// --- 应用初始化 ---
document.addEventListener('DOMContentLoaded', showLobby);
