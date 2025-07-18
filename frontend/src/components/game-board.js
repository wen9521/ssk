/**
 * game-board.js (行业标准横屏重构版)
 *
 * 布局严格遵循主流棋牌游戏的横屏设计规范。
 * - 稳定的三角布局：玩家在下，对手在左上/右上。
 * - 清晰的功能区划分。
 */
export function renderGameBoard(players) {
    // 布局顺序: [你, 你的下家(右上), 你的上家(左上)]
    const you = players[0];
    const rightAI = players[1];
    const leftAI = players[2];

    return `
        <div class="game-board professional-landscape">

            <!-- 左上角对手 -->
            <div class="player-pod top-left" id="${leftAI.id}">
                <div class="player-avatar">AI</div>
                <div class="player-details">
                    <div class="player-name">${leftAI.name}</div>
                    <div class="card-count"><b>${leftAI.hand.length}</b></div>
                </div>
                <div class="player-status-bubble" id="status-${leftAI.id}"></div>
            </div>

            <!-- 右上角对手 -->
            <div class="player-pod top-right" id="${rightAI.id}">
                <div class="player-avatar">AI</div>
                <div class="player-details">
                    <div class="player-name">${rightAI.name}</div>
                    <div class="card-count"><b>${rightAI.hand.length}</b></div>
                </div>
                <div class="player-status-bubble" id="status-${rightAI.id}"></div>
            </div>

            <!-- 顶部中央公共信息 -->
            <div class="top-center-info">
                <div id="landlord-cards-area" class="hand"></div>
            </div>

            <!-- 屏幕中央出牌区 -->
            <div class="play-area-center">
                <div id="played-cards-area" class="hand"></div>
            </div>

            <!-- 底部玩家区域 (你) -->
            <div class="player-pod bottom-center" id="${you.id}">
                 <div class="action-buttons-container">
                    <button id="pass-btn" class="action-btn pass" disabled>不要</button>
                    <button id="play-btn" class="action-btn play" disabled>出牌</button>
                </div>
                <div id="hand-${you.id}" class="hand player-hand"></div>
            </div>

        </div>
    `;
}
