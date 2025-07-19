// frontend/src/components/thirteen-water-ui.js

export function renderThirteenWaterBoard(players) {
    const you = players[0];
    const aiPlayers = players.slice(1);

    return `
    <div class="sss-game-container">
        <div class="sss-main-panel">
            
            <!-- 头部 -->
            <div class="sss-header">
                <button id="exit-sss-btn" class="exit-btn">&lt; 退出房间</button>
                <div class="score-display">
                    <span class="icon">🪙</span>
                    积分：100
                </div>
            </div>

            <!-- 玩家座位区 -->
            <div class="sss-player-seats">
                <div id="${you.id}" class="sss-seat me">
                    <div>${you.name}</div>
                    <div class="status">准备中...</div>
                </div>
                ${aiPlayers.map(ai => `
                    <div id="${ai.id}" class="sss-seat">
                        <div>${ai.name}</div>
                        <div class="status">理牌中...</div>
                    </div>
                `).join('')}
            </div>

            <!-- 牌墩区域 -->
            <div id="front-dun" class="sss-dun-area">
                <div class="card-display-area"></div>
                <div class="dun-label">头道 (0/3)</div>
            </div>
            <div id="middle-dun" class="sss-dun-area">
                <div class="card-display-area"></div>
                <div class="dun-label">中道 (0/5)</div>
            </div>
            <div id="back-dun" class="sss-dun-area">
                <div class="card-display-area"></div>
                <div class="dun-label">尾道 (0/5)</div>
            </div>

            <!-- 自己的手牌/操作区 -->
            <div id="player-hand-area" class="card-display-area my-hand">
                <!-- 卡牌由JS动态渲染 -->
            </div>

            <!-- 按钮区 -->
            <div class="sss-action-buttons">
                <button id="ready-btn" class="sss-btn">准备</button>
                <button id="auto-group-btn" class="sss-btn" disabled>智能分牌</button>
                <button id="compare-btn" class="sss-btn" disabled>开始比牌</button>
            </div>

            <!-- 消息区 -->
            <div id="sss-message" class="sss-message-area"></div>
            
            <!-- 结果弹窗 -->
            <div id="thirteen-water-results" class="sss-result-modal-overlay">
                <div class="sss-result-modal">
                    <button class="close-btn">&times;</button>
                    <!-- 结果内容由JS动态生成 -->
                </div>
            </div>

        </div>
    </div>
    `;
}
