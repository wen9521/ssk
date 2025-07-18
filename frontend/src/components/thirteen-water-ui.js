/**
 * thirteen-water-ui.js
 * 
 * 负责渲染十三水游戏的UI界面。
 */

export function renderThirteenWaterBoard(players, state = {}) {
    // players: [{id, name, hand, groups}]
    // state: {scores, foulStates, msg}
    
    // 基本参数
    const PAI_DUN_HEIGHT = 133;
    const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
    const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

    function renderPaiDunCards(cards) {
        if (!cards || cards.length === 0) return '';
        return cards.map((card, idx) => `
            <div class="card small-card" style="z-index:${idx};">
                <img src="/assets/cards/${card.id}" alt="${card.fullName || card.id}" draggable="false"/>
            </div>
        `).join('');
    }

    // 牌墩
    function renderPaiDun(cards, label, area) {
        return `
        <div class="tw-pai-dun" data-area="${area}">
            <div class="tw-pai-dun-cards">${renderPaiDunCards(cards)}</div>
            <div class="tw-pai-dun-label">${label}</div>
        </div>
        `;
    }

    // 主界面
    return `
    <div class="game-board thirteen-water-board">
        <div class="player-area top-center">
            <div class="tw-player-seats">
                ${players.map((p, idx) => `
                    <div class="player-pod tw-player-seat ${idx === 0 ? 'me' : ''}">
                        <div class="player-avatar">${p.name.substring(0, 2)}</div>
                        <div class="player-details">
                            <div class="player-name">${p.name}</div>
                            <div class="tw-status">${idx === 0 ? '你' : (p.groups[0].length > 0 ? '已理牌' : '理牌中…')}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="player-area play-area-center">
             <div id="grouped-area">
                ${renderPaiDun(players[0].groups[2] || [], '尾道', 'tail')}
                ${renderPaiDun(players[0].groups[1] || [], '中道', 'middle')}
                ${renderPaiDun(players[0].groups[0] || [], '头道', 'head')}
             </div>
        </div>

        <div class="player-area bottom-center">
            <div id="play-buttons-container" class="action-buttons-container">
                <button id="group-btn" class="action-btn">智能分牌</button>
                <button id="compare-btn" class="action-btn play">开始比牌</button>
            </div>
            <div class="thirteen-water-message">${state.msg || ''}</div>
        </div>

        <style>
            .thirteen-water-board {
                grid-template-rows: auto 1fr auto;
                grid-template-columns: 1fr;
                max-width: 500px;
                margin: 0 auto;
            }
            .tw-player-seats {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 1rem;
            }
            .tw-player-seat {
                flex-basis: 45%;
            }
            .tw-status {
                color: var(--accent-color);
                font-weight: bold;
            }
            #grouped-area {
                width: 100%;
                padding: 1rem;
            }
            .tw-pai-dun {
                background: var(--pod-bg);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 15px;
                padding: 1rem;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: ${PAI_DUN_HEIGHT}px;
            }
            .tw-pai-dun-cards {
                display: flex;
                flex-grow: 1;
            }
            .tw-pai-dun-cards .small-card {
                width: ${CARD_WIDTH}px;
                height: ${CARD_HEIGHT}px;
            }
            .tw-pai-dun-cards .small-card:not(:first-child) {
                margin-left: -${CARD_WIDTH / 2}px;
            }
            .tw-pai-dun-label {
                font-size: 1.2rem;
                font-weight: bold;
                color: var(--accent-color-secondary);
            }
            .thirteen-water-message {
                margin-top: 1rem;
                color: var(--accent-color);
                font-size: 1.1rem;
                min-height: 2rem;
            }
        </style>
    </div>
    `;
}
