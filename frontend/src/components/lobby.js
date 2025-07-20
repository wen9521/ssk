export function renderLobby() {
    return `
        <div class="lobby-container">
            <h1 class="lobby-title">游戏中心</h1>
            <div class="game-menu">
                
                <div class="game-card" data-game="thirteen-water">
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