export function renderLobby() {
    return `
        <div class="lobby-container">
            <h1 class="lobby-title">游戏大厅</h1>
            <div class="game-menu">
                
                <div class="game-card" id="start-offline-btn">
                    <h2 class="game-title">单机斗地主</h2>
                    <p class="game-description">与两位聪明的 AI 对手一决高下，随时随地享受经典乐趣。</p>
                    <button class="start-btn">开始游戏</button>
                </div>

                <div class="game-card disabled">
                    <div class="coming-soon-badge">敬请期待</div>
                    <h2 class="game-title">在线对战</h2>
                    <p class="game-description">与来自世界各地的玩家实时匹配，挑战全球高手。</p>
                    <button class="start-btn" id="start-online-btn" disabled>进入战场</button>
                </div>

                <div class="game-card disabled">
                     <div class="coming-soon-badge">敬请期待</div>
                    <h2 class="game-title">锄大地</h2>
                    <p class="game-description">经典的四人牌局，体验步步为营的策略对决。</p>
                    <button class="start-btn" disabled>即将推出</button>
                </div>

                 <div class="game-card disabled">
                     <div class="coming-soon-badge">敬请期待</div>
                    <h2 class="game-title">十三水</h2>
                    <p class="game-description">组合你的终极牌型，感受独特的策略和运气比拼。</p>
                    <button class="start-btn" disabled>即将推出</button>
                </div>

            </div>
        </div>
    `;
}
