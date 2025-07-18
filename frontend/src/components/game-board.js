/**
 * game-board.js (全新重构版)
 * 
 * 布局完全仿照经典手机竖屏斗地主界面。
 * - 玩家自己手牌在底部。
 * - 左右两个AI玩家只显示头像、状态和剩余牌数。
 * - 所有元素使用绝对/相对定位，以适应不同屏幕尺寸。
 */
export function renderGameBoard(players) {
    const you = players[0];
    const rightAI = players[1]; // 你的下家在右边
    const leftAI = players[2];  // 你的上家在左边

    return `
        <div class="game-board classic-view">
            <!-- 顶部信息区 -->
            <div class="top-info">
                <span>底牌</span>
                <div id="landlord-cards-area" class="hand">
                    <!-- 地主底牌会在这里显示 -->
                </div>
                <span>倍数: <b id="game-multiplier">1</b></span>
            </div>

            <!-- 左侧AI玩家 -->
            <div class="player-area-side left-ai">
                <div class="player-avatar">AI</div>
                <div class="player-info">
                    <div class="player-name">${leftAI.name}</div>
                    <div class="player-status" id="status-${leftAI.id}"></div>
                </div>
                <div class="card-count-badge" id="card-count-${leftAI.id}">17</div>
            </div>

            <!-- 右侧AI玩家 -->
            <div class="player-area-side right-ai">
                <div class="player-avatar">AI</div>
                <div class="player-info">
                    <div class="player-name">${rightAI.name}</div>
                    <div class="player-status" id="status-${rightAI.id}"></div>
                </div>
                <div class="card-count-badge" id="card-count-${rightAI.id}">17</div>
            </div>
            
            <!-- 中央出牌区 -->
            <div class="play-area-center">
                <div id="played-cards-area" class="hand"></div>
            </div>

            <!-- 底部玩家 (你) -->
            <div class="player-area-bottom">
                <div class="action-buttons">
                    <button id="play-btn" class="action-btn play">出牌</button>
                    <button id="pass-btn" class="action-btn pass">不要</button>
                    <!-- 其他按钮如“提示”、“抢地主”等可以加在这里 -->
                </div>
                <div id="hand-${you.id}" class="hand player-hand"></div>
            </div>
        </div>
    `;
}
