
/**
 * bidding-ui.js
 * 
 * 负责渲染叫地主阶段的UI界面和按钮。
 */

/**
 * 渲染叫地主的操作按钮
 * @param {number} highestBid - 当前最高的叫分，用于禁用按钮
 * @returns {string} - 返回HTML字符串
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

/**
 * 渲染一个等待或提示的UI，用于展示其他玩家的叫分状态
 * @param {string} text - 要显示的文字
 * @returns {string}
 */
export function renderBiddingStatus(text) {
    return `<div class="bidding-status-indicator">${text}</div>`;
}
