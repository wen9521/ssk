export function renderGameBoard(players) {
    // 整体牌桌布局，类似十三水
    const you = players[0];
    const rightAI = players[1];
    const leftAI = players[2];

    return `
        <div class="doudizhu-table-container">
            <div class="table-header">
                <div class="player-pod side left" id="${leftAI.id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${leftAI.name}</div>
                        <div class="card-count">牌: <b>${leftAI.hand.length}</b></div>
                    </div>
                    <div class="player-status-bubble" id="status-${leftAI.id}"></div>
                </div>
                <div class="landlord-cards-area" id="landlord-cards-area"></div>
                <div class="player-pod side right" id="${rightAI.id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${rightAI.name}</div>
                        <div class="card-count">牌: <b>${rightAI.hand.length}</b></div>
                    </div>
                    <div class="player-status-bubble" id="status-${rightAI.id}"></div>
                </div>
            </div>
            <div class="table-center">
                <div id="played-cards-area" class="played-cards-area"></div>
                <div id="multiplier-indicator" class="multiplier-indicator"></div>
            </div>
            <div class="table-footer">
                <div class="player-pod me" id="${you.id}">
                    <div class="player-avatar">你</div>
                    <div class="player-details">
                        <div class="player-name">${you.name}</div>
                        <div class="card-count">牌: <b>${you.hand.length}</b></div>
                    </div>
                    <div class="player-status-bubble" id="status-${you.id}"></div>
                </div>
                <div class="hand-container" id="hand-${you.id}"></div>
                <div class="action-buttons-container">
                    <button id="pass-btn" class="action-btn pass" disabled>不要</button>
                    <button id="play-btn" class="action-btn play" disabled>出牌</button>
                </div>
            </div>
        </div>
    `;
}
