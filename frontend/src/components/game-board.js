// QQ斗地主手机版风格布局：玩家底部居中，AI两侧上方，地主牌/出牌区中央，按钮区底部
export function renderGameBoard(players) {
    const you = players[0];
    const rightAI = players[1];
    const leftAI = players[2];

    return `
    <div class="ddz-mobile-table">
        <div class="ddz-top-row">
            <div class="player-ai left" id="${leftAI.id}">
                <div class="avatar"></div>
                <div class="ai-info">
                    <span class="name">${leftAI.name}</span>
                    <span class="card-count">${leftAI.hand.length}</span>
                </div>
                <div class="player-status-bubble" id="status-${leftAI.id}"></div>
            </div>
            <div class="landlord-cards" id="landlord-cards-area"></div>
            <div class="player-ai right" id="${rightAI.id}">
                <div class="avatar"></div>
                <div class="ai-info">
                    <span class="name">${rightAI.name}</span>
                    <span class="card-count">${rightAI.hand.length}</span>
                </div>
                <div class="player-status-bubble" id="status-${rightAI.id}"></div>
            </div>
        </div>
        <div class="ddz-center-row">
            <div id="played-cards-area" class="played-cards-area"></div>
            <div id="multiplier-indicator" class="multiplier-indicator"></div>
        </div>
        <div class="ddz-bottom-row">
            <div class="player-me" id="${you.id}">
                <div class="avatar"></div>
                <div class="name">${you.name}</div>
                <div class="player-status-bubble" id="status-${you.id}"></div>
            </div>
            <div class="hand-container" id="hand-${you.id}"></div>
            <div class="action-btns">
                <button id="tip-btn" class="action-btn tip">提示</button>
                <button id="pass-btn" class="action-btn pass" disabled>不要</button>
                <button id="play-btn" class="action-btn play" disabled>出牌</button>
            </div>
        </div>
    </div>
    `;
}
