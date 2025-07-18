/**
 * thirteen-water-ui.js
 * 
 * 负责渲染十三水游戏的UI界面（分牌和比牌界面，仿照你提供的React布局，适配原生JS）。
 */

export function renderThirteenWaterBoard(players, state = {}) {
    // players: [{id, name, hand, head, middle, tail, processed, isAI}]
    // state: {isReady, hasCompared, showResult, scores, foulStates, msg}
    
    // 基本参数
    const OUTER_MAX_WIDTH = 420;
    const PAI_DUN_HEIGHT = 133;
    const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
    const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

    // 玩家区
    function renderPlayerSeats() {
        return `
        <div class="tw-player-seats">
            ${players.map((p, idx) => `
                <div class="tw-player-seat${idx === 0 ? ' me' : ''}" style="
                    color: ${idx === 0 ? '#fdbb2d' : (p.processed ? '#fdbb2d' : '#fff')};
                    background: var(--pod-bg);
                ">
                    <div>${p.name}</div>
                    <div style="margin-top:4px;font-size:13px;font-weight:400;">
                        ${idx === 0 ? '你' : (p.processed ? '已理牌' : '理牌中…')}
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    }

    // 牌墩
    function renderPaiDun(cards, label, area, color = '#fdbb2d') {
        return `
        <div class="tw-pai-dun" data-area="${area}" style="background: var(--pod-bg);">
            <div class="tw-pai-dun-cards">${renderPaiDunCards(cards, area)}</div>
            <div class="tw-pai-dun-label" style="color:${color};">${label}（${cards.length}）</div>
        </div>
        `;
    }

    // 牌图片排列
    function renderPaiDunCards(arr, area) {
        // 重叠偏移
        const paddingX = 16;
        const maxWidth = OUTER_MAX_WIDTH - 2 * paddingX - 70;
        let overlap = Math.floor(CARD_WIDTH / 3);
        if (arr.length > 1) {
            const totalWidth = CARD_WIDTH + (arr.length - 1) * overlap;
            if (totalWidth > maxWidth) {
                overlap = Math.floor((maxWidth - CARD_WIDTH) / (arr.length - 1));
            }
        }
        let lefts = [];
        let startX = 0;
        for (let i = 0; i < arr.length; ++i) {
            lefts.push(startX + i * overlap);
        }
        return arr.map((card, idx) => `
            <img src="/assets/cards/${card.id}" alt="${card.fullName || card.id}"
                class="tw-card-img"
                style="
                    position:absolute;
                    left:${lefts[idx]}px;
                    top:${((PAI_DUN_HEIGHT-CARD_HEIGHT)/2)}px;
                    z-index:${idx};
                    width:${CARD_WIDTH}px;
                    height:${CARD_HEIGHT}px;
                    border-radius:5px;
                    background:#fff;
                "
                draggable="false"
            />
        `).join('');
    }

    // 比牌结果弹窗
    function renderResultModal() {
        if (!state.showResult) return '';
        const scale = 0.9;
        const cardW = Math.floor(CARD_WIDTH * scale);
        const cardH = Math.floor(CARD_HEIGHT * scale);

        return `
        <div class="tw-modal-mask">
            <div class="tw-modal-content">
                ${players.map((p, i) => `
                    <div class="tw-modal-player">
                        <div class="tw-modal-player-name" style="color:${i === 0 ? 'var(--accent-color)' : '#4f8cff'}">
                            ${p.name}
                            ${state.foulStates && state.foulStates[i] ? '<span style="color:red;font-weight:800;margin-left:6px;">（倒水）</span>' : ''}
                            （${state.scores ? state.scores[i] : 0}分）
                        </div>
                        <div class="tw-modal-cards">${renderPaiDunCards(p.head || [], 'none', cardW, cardH)}</div>
                        <div class="tw-modal-cards">${renderPaiDunCards(p.middle || [], 'none', cardW, cardH)}</div>
                        <div class="tw-modal-cards">${renderPaiDunCards(p.tail || [], 'none', cardW, cardH)}</div>
                    </div>
                `).join('')}
                <button class="tw-modal-close" onclick="document.querySelector('.tw-modal-mask').style.display='none'">×</button>
            </div>
        </div>
        `;
    }
    
    // 主界面
    return `
    <div class="tw-board-root" style="background:var(--bg-gradient-main);min-height:100vh;">
        <div class="tw-board-main" style="
            max-width:${OUTER_MAX_WIDTH}px;
            width:100%;
            margin:30px auto;
            background:var(--pod-bg);
            border-radius:22px;
            box-shadow:0 4px 22px var(--shadow-dark),0 1.5px 5px var(--shadow-dark);
            padding:16px;
            min-height:650px;
        ">
            <div style="display:flex;align-items:center;margin-bottom:14px;">
                <button class="tw-exit-btn" style="
                    background:linear-gradient(90deg,#fff 60%,#e0fff1 100%);
                    color:#234;font-weight:bold;border:none;border-radius:9px;
                    padding:7px 22px;cursor:pointer;margin-right:18px;font-size:17px;
                    box-shadow:0 1.5px 6px rgba(0,0,0,0.3);
                ">&lt; 退出房间</button>
                <div style="flex:1;text-align:right;color:var(--accent-color);font-weight:900;font-size:21px;letter-spacing:2px;margin-right:8px;text-shadow:0 2px 7px rgba(0,0,0,0.44);">
                    <span style="font-size:18px;margin-right:4px;">🪙</span>积分：100
                </div>
            </div>
            ${renderPlayerSeats()}
            ${renderPaiDun(players[0].head || [], '头道', 'head')}
            ${renderPaiDun(players[0].middle || [], '中道', 'middle')}
            ${renderPaiDun(players[0].tail || [], '尾道', 'tail')}
            <div style="display:flex;gap:12px;margin-bottom:0;margin-top:14px;">
                <button id="group-btn" class="tw-smart-btn" style="flex:1;background:var(--btn-play-bg);color:#fff;font-weight:700;border:none;border-radius:10px;padding:13px 0;font-size:18px;cursor:pointer;box-shadow:0 2px 9px rgba(0,0,0,0.44);">
                    智能分牌
                </button>
                <button id="compare-btn" class="tw-compare-btn" style="flex:1;background:var(--btn-match-bg);color:#fff;font-weight:700;border:none;border-radius:10px;padding:13px 0;font-size:18px;cursor:pointer;box-shadow:0 2px 9px rgba(0,0,0,0.55);">
                    开始比牌
                </button>
            </div>
            <div style="color:#c3e1d1;text-align:center;font-size:16px;margin-top:8px;min-height:24px;">
                ${state.msg || ''}
            </div>
            ${renderResultModal()}
        </div>
        <style>
        .tw-player-seats{display:flex;margin-bottom:18px;gap:8px;}
        .tw-player-seat{border:none;border-radius:10px;margin-right:8px;width:22%;min-width:70px;text-align:center;padding:12px 0;font-weight:700;font-size:17px;box-shadow:0 4px 22px var(--shadow-dark),0 1.5px 5px var(--shadow-dark);box-sizing:border-box;}
        .tw-player-seat.me{background:var(--pod-bg);color:var(--accent-color);}
        .tw-pai-dun{width:100%;border-radius:14px;min-height:${PAI_DUN_HEIGHT}px;height:${PAI_DUN_HEIGHT}px;margin-bottom:20px;position:relative;box-shadow:0 4px 22px var(--shadow-dark),0 1.5px 5px var(--shadow-dark);display:flex;align-items:center;box-sizing:border-box;padding-left:16px;padding-right:70px;}
        .tw-pai-dun-cards{flex:1;height:100%;position:relative;display:flex;align-items:center;min-width:0;}
        .tw-pai-dun-label{position:absolute;right:16px;top:0;height:100%;display:flex;align-items:center;font-size:18px;font-weight:600;pointer-events:none;background:transparent;white-space:nowrap;}
        .tw-card-img{user-select:none;}
        .tw-modal-mask{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.37);z-index:1000;display:flex;align-items:center;justify-content:center;}
        .tw-modal-content{background:var(--pod-bg);border-radius:15px;padding:24px;min-width:400px;min-height:270px;box-shadow:0 8px 40px #0002;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px;position:relative;}
        .tw-modal-player{text-align:center;border-bottom:1px solid #eee;}
        .tw-modal-player-name{font-weight:700;margin-bottom:8px;}
        .tw-modal-cards{display:flex;justify-content:center;gap:4px;margin-bottom:3px;}
        .tw-modal-close{position:absolute;right:18px;top:12px;background:transparent;border:none;font-size:22px;color:#888;cursor:pointer;}
        @media (max-width:480px){
            .tw-player-seat{margin-right:4px !important;width:24% !important;min-width:0 !important;}
            .tw-card-img{width:${Math.floor(CARD_WIDTH*0.92)}px !important;height:${Math.floor(CARD_HEIGHT*0.92)}px !important;}
        }
        </style>
    </div>
    `;
}
