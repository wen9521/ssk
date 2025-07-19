/**
 * bidding-ui.js
 * 
 * 负责渲染叫地主阶段的UI界面和按钮。
 */

export function renderBiddingControls(highestBid = 0) {
    return `
        <div id="bidding-container" class="action-buttons-container">
            <button id="bid-btn-0" class="action-btn pass" data-bid="0">不叫</button>
            <button id="bid-btn-1" class="action-btn play" data-bid="1" ${highestBid >= 1 ? 'disabled' : ''}>1 分</button>
            <button id="bid-btn-2" class="action-btn play" data-bid="2" ${highestBid >= 2 ? 'disabled' : ''}>2 分</button>
            <button id="bid-btn-3" class="action-btn play" data-bid="3" ${highestBid >= 3 ? 'disabled' : ''}>3 分</button>
        </div>
    `;
}

export function renderBiddingStatus(text) {
    return `<div class="bidding-status-indicator">${text}</div>`;
}