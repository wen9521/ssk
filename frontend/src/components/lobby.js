export function renderLobby() {
    return `
        <div class="lobby-container">
            <h1>棋牌大厅</h1>
            <div class="menu">
                <button id="start-offline-btn" class="menu-btn">单机斗地主</button>
                <button id="start-online-btn" class="menu-btn" disabled>在线对战</button>
                <button class="menu-btn" disabled>锄大地</button>
                <button class="menu-btn" disabled>十三水</button>
            </div>
        </div>
    `;
}
