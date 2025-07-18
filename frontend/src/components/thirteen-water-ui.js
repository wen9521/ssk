/**
 * thirteen-water-ui.js
 * 
 * 十三水游戏的UI界面。
 */
export function renderThirteenWaterBoard(players) {
    const you = players[0];
    return `
        <div class="game-board">
            <div class="player-area top-left">
                <div class="player-pod" id="${players[3].id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${players[3].name}</div>
                    </div>
                </div>
            </div>
            <div class="player-area game-info">
                <div class="player-pod" id="${players[2].id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${players[2].name}</div>
                    </div>
                </div>
            </div>
            <div class="player-area top-right">
                <div class="player-pod" id="${players[1].id}">
                    <div class="player-avatar">AI</div>
                    <div class="player-details">
                        <div class="player-name">${players[1].name}</div>
                    </div>
                </div>
            </div>
            <div class="player-area bottom-center">
                <div id="hand-${you.id}" class="hand player-hand"></div>
                <div class="action-buttons-container">
                    <button id="group-btn" class="action-btn play">自动理牌/分墩</button>
                    <button id="compare-btn" class="action-btn play" disabled>比牌</button>
                </div>
                <div id="grouped-area"></div>
            </div>
        </div>
    `;
}
