export function renderGameBoard(players) {
    return `
        <div class="game-board">
            <!-- 上方玩家 -->
            <div class="player-area top-player">
                <div id="hand-${players[2].id}" class="hand"></div>
                <div class="player-info">
                    <span>${players[2].name}</span> | 
                    <span>剩余: <b id="card-count-${players[2].id}">17</b></span>
                </div>
            </div>

            <!-- 中间区域 -->
            <div class="middle-area">
                <!-- 左侧玩家 -->
                <div class="player-area left-player">
                    <div id="hand-${players[1].id}" class="hand"></div>
                    <div class="player-info">
                        <span>${players[1].name}</span> | 
                        <span><b id="card-count-${players[1].id}">17</b></span>
                    </div>
                </div>

                <!-- 出牌区 -->
                <div class="play-area">
                    <p id="played-cards-info" class="played-cards-info"></p>
                    <div id="played-cards-area" class="hand"></div>
                </div>
                
                <!-- 右侧玩家 (为4人游戏预留) -->
                <div class="player-area right-player"></div>
            </div>

            <!-- 底部玩家 (你) -->
            <div class="player-area bottom-player">
                <div class="action-buttons">
                    <button id="pass-btn" class="menu-btn">不要</button>
                    <button id="play-btn" class="menu-btn">出牌</button>
                </div>
                <div id="hand-${players[0].id}" class="hand player-hand"></div>
                <div class="player-info">
                    <span>${players[0].name}</span> | 
                    <span>剩余: <b id="card-count-${players[0].id}">17</b></span>
                </div>
            </div>
        </div>
    `;
}
