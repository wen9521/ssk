export function renderGameBoard(players) {
    return `
        <div class="game-board">
            <!-- Top Player Area -->
            <div class="player-area top-player">
                <p>${players[2].name} (剩余: <span id="card-count-${players[2].id}">17</span>)</p>
                <div id="hand-${players[2].id}" class="hand"></div>
            </div>

            <!-- Middle Area -->
            <div class="middle-area">
                <div class="player-area left-player">
                    <p>${players[1].name} (剩余: <span id="card-count-${players[1].id}">17</span>)</p>
                    <div id="hand-${players[1].id}" class="hand"></div>
                </div>
                <div class="play-area">
                    <p>出牌区</p>
                    <div id="played-cards-area" class="hand"></div>
                </div>
                <!-- Placeholder for right player in a 4-player game -->
            </div>

            <!-- Bottom (Human) Player Area -->
            <div class="player-area bottom-player">
                <p>${players[0].name} (剩余: <span id="card-count-${players[0].id}">17</span>)</p>
                <div id="hand-${players[0].id}" class="hand player-hand"></div>
                <div class="action-buttons">
                    <button id="play-btn">出 牌</button>
                    <button id="pass-btn">不 要</button>
                </div>
            </div>
        </div>
    `;
}
