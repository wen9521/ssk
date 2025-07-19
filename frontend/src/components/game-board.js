export function renderGameBoard(players) {
    const you = players[0];
    const rightAI = players[1];
    const leftAI = players[2];

    return `
        <div class="game-board">
            <div class="player-area left-player">
                <div class="player-pod" id="${leftAI.id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${leftAI.name}</div>
                        <div class="card-count">牌: <b>${leftAI.hand.length}</b></div>
                    </div>
                    <div class="player-status-bubble" id="status-${leftAI.id}"></div>
                </div>
            </div>

            <div class="player-area top-player">
                 <div id="landlord-cards-area" class="hand"></div>
            </div>

            <div class="player-area right-player">
                <div class="player-pod" id="${rightAI.id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${rightAI.name}</div>
                        <div class="card-count">牌: <b>${rightAI.hand.length}</b></div>
                    </div>
                    <div class="player-status-bubble" id="status-${rightAI.id}"></div>
                </div>
            </div>

            <div class="player-area play-area">
                <div id="played-cards-area" class="hand"></div>
            </div>

            <div class="player-area bottom-player">
                <div id="hand-${you.id}" class="hand player-hand"></div>
                <div class="action-buttons-container">
                    <button id="pass-btn" class="action-btn pass" disabled>不要</button>
                    <button id="play-btn" class="action-btn play" disabled>出牌</button>
                </div>
            </div>
        </div>
    `;
}
