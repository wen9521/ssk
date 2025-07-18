export function renderLobby() {
    return `
        <div class="lobby-container">
            <h1 class="lobby-title">游戏中心</h1>
            <div class="game-menu">
                
                <div class="game-card" data-game="doudizhu">
                    <h2 class="game-title">斗地主</h2>
                    <p class="game-description">经典的欢乐斗地主，三人对战，体验抢地主和加倍的刺激。</p>
                    <div class="action-buttons">
                        <button class="lobby-btn trial">离线试玩</button>
                        <button class="lobby-btn match" disabled>在线匹配</button>
                    </div>
                </div>

                <div class="game-card" data-game="chudadi">
                    <h2 class="game-title">锄大地</h2>
                    <p class="game-description">流行于华语地区的四人牌类游戏，体验顶级牌手的策略对决。</p>
                    <div class="action-buttons">
                        <button class="lobby-btn trial">离线试玩</button>
                        <button class="lobby-btn match" disabled>在线匹配</button>
                    </div>
                </div>

                <div class="game-card" data-game="thirteen">
                     <h2 class="game-title">十三水</h2>
                     <p class="game-description">福建地区的特色牌类游戏，组合你的手牌，与AI一较高下。</p>
                     <div class="action-buttons">
                        <button class="lobby-btn trial">离线试玩</button>
                        <button class="lobby-btn match" disabled>在线匹配</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
