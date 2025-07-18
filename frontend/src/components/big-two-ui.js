/**
 * big-two-ui.js
 * 
 * 锄大地游戏的UI界面。
 */
export function renderBigTwoBoard(players) {
    // 四人座位：您-下家-对家-上家
    const you = players[0];
    const nextAI = players[1];
    const acrossAI = players[2];
    const prevAI = players[3];

    return `
        <div class="game-board">
            <div class="player-area top-left">
                <div class="player-pod" id="${prevAI.id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${prevAI.name}</div>
                        <div class="card-count">牌: <b>${prevAI.hand.length}</b></div>
                    </div>
                    <div class="player-status-bubble" id="status-${prevAI.id}"></div>
                </div>
            </div>
            <div class="player-area game-info">
                <div class="player-pod" id="${acrossAI.id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${acrossAI.name}</div>
                        <div class="card-count">牌: <b>${acrossAI.hand.length}</b></div>
                    </div>
                    <div class="player-status-bubble" id="status-${acrossAI.id}"></div>
                </div>
            </div>
            <div class="player-area top-right">
                <div class="player-pod" id="${nextAI.id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${nextAI.name}</div>
                        <div class="card-count">牌: <b>${nextAI.hand.length}</b></div>
                    </div>
                    <div class="player-status-bubble" id="status-${nextAI.id}"></div>
                </div>
            </div>
            <div class="player-area play-area">
                <div id="played-cards-area" class="hand"></div>
            </div>
            <div class="player-area bottom-center">
                <div id="hand-${you.id}" class="hand player-hand"></div>
                <div class="action-buttons-container">
                    <button id="pass-btn" class="action-btn pass" disabled>不要</button>
                    <button id="play-btn" class="action-btn play" disabled>出牌</button>
                </div>
            </div>
        </div>
    `;
}
