export function renderThirteenWaterBoard(players) {
    return `
        <div class="thirteen-water-container">
            <div class="sss-header">
                <button id="exit-sss-btn" class="exit-btn">&lt; 退出房间</button>
                <div class="player-score">
                    <span>🪙</span> 积分：1000
                </div>
            </div>

            <div class="player-seats">
                ${players.map((p, index) => `
                    <div class="player-seat" id="seat-${p.id}">
                        <div>${p.name}</div>
                        <div class="status">${index === 0 ? '你' : '理牌中...'}</div>
                    </div>
                `).join('')}
            </div>

            <div id="player-hand-area" class="sss-hand-area">
                <!-- 玩家的13张手牌将在这里渲染 -->
            </div>

            <div class="dun-area-container">
                <div class="dun-area" id="front-dun" data-dun-index="0">
                    <div class="dun-label">头道 (3)</div>
                </div>
                <div class="dun-area" id="middle-dun" data-dun-index="1">
                    <div class="dun-label">中道 (5)</div>
                </div>
                <div class="dun-area" id="back-dun" data-dun-index="2">
                    <div class="dun-label">尾道 (5)</div>
                </div>
            </div>

            <div class="sss-actions">
                 <button id="ready-btn" class="action-btn ready">准备</button>
                 <button id="auto-group-btn" class="action-btn auto-split" disabled>智能分牌</button>
                 <button id="compare-btn" class="action-btn compare" disabled>开始比牌</button>
            </div>
            <div id="sss-message" class="sss-message-area"></div>
            
            <div id="thirteen-water-results" class="results-overlay"></div>
        </div>
    `;
}
