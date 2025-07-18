/**
 * game-board.js (专业横屏重构版)
 * 
 * 布局完全仿照主流棋牌游戏的横屏设计。
 * - 玩家在底部中心。
 * - 左右两侧为对手，只显示头像、状态和牌数。
 * - 所有元素使用绝对定位，精确布局。
 */
export function renderGameBoard(players) {
    // 布局顺序: [你, 你的下家(右侧AI), 你的上家(左侧AI)]
    const you = players[0];
    const rightAI = players[1];
    const leftAI = players[2];

    return `
        <div class="game-board landscape-view">
            <!-- 顶部信息栏 -->
            <div class="top-info-bar">
                <div id="landlord-cards-area" class="hand"></div>
            </div>

            <!-- 左侧AI -->
            <div class="player-pod left-ai" id="${leftAI.id}">
                <div class="player-avatar">AI</div>
                <div class="player-details">
                    <div class="player-name">${leftAI.name}</div>
                    <div class="card-count">剩余: <b id="card-count-${leftAI.id}">17</b></div>
                </div>
                <div class="player-status-bubble" id="status-${leftAI.id}"></div>
            </div>

            <!-- 右侧AI -->
            <div class="player-pod right-ai" id="${rightAI.id}">
                <div class="player-avatar">AI</div>
                <div class="player-details">
                    <div class="player-name">${rightAI.name}</div>
                    <div class="card-count">剩余: <b id="card-count-${rightAI.id}">17</b></div>
                </div>
                <div class="player-status-bubble" id="status-${rightAI.id}"></div>
            </div>

            <!-- 中央出牌区 -->
            <div class="play-area-center">
                <div id="played-cards-area" class="hand"></div>
            </div>

            <!-- 底部操作区 (你) -->
            <div class="bottom-area" id="${you.id}">
                <div id="hand-${you.id}" class="hand player-hand"></div>
                <div class="action-buttons-container">
                    <button id="pass-btn" class="action-btn pass" disabled>不要</button>
                    <button id="play-btn" class="action-btn play" disabled>出牌</button>
                </div>
            </div>
        </div>
    `;
}
