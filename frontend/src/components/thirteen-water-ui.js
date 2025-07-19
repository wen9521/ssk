/**
 * thirteen-water-ui.js
 * 
 * 负责渲染十三水游戏的整个交互界面, 包括手牌区和三墩。
 */
import { makeDroppable } from './card.js';

export function renderThirteenWaterBoard(player, onDropCard) {
    const mainPlayer = player[0];

    const boardHTML = `
        <div class="thirteen-water-board">
            <div class="opponent-areas">
                <!-- 对手区域可以简化显示 -->
                <div class="opponent" id="opponent-1"></div>
                <div class="opponent" id="opponent-2"></div>
                <div class="opponent" id="opponent-3"></div>
            </div>

            <div class="player-main-area">
                <div class="dun-area-container">
                    <div class="dun-area" id="front-dun" data-dun-index="0">
                        <div class="dun-placeholder">头墩 (3张)</div>
                    </div>
                    <div class="dun-area" id="middle-dun" data-dun-index="1">
                        <div class="dun-placeholder">中墩 (5张)</div>
                    </div>
                    <div class="dun-area" id="back-dun" data-dun-index="2">
                        <div class="dun-placeholder">尾墩 (5张)</div>
                    </div>
                </div>

                <div class="player-hand-area" id="player-hand-area">
                    <!-- 玩家的13张手牌将在这里渲染 -->
                </div>
            </div>
            
            <div class="thirteen-water-controls">
                <button id="auto-group-btn" class="action-btn">自动理牌</button>
                <button id="compare-btn" class="action-btn play" disabled>理好了</button>
            </div>

            <div id="thirteen-water-results" class="results-overlay"></div>
        </div>
    `;
    
    // 渲染完HTML后，为墩区添加拖放功能
    // 使用setTimeout确保DOM元素已经实际存在于页面中
    setTimeout(() => {
        const frontDun = document.getElementById('front-dun');
        const middleDun = document.getElementById('middle-dun');
        const backDun = document.getElementById('back-dun');

        if (frontDun) makeDroppable(frontDun, onDropCard);
        if (middleDun) makeDroppable(middleDun, onDropCard);
        if (backDun) makeDroppable(backDun, onDropCard);
    }, 0);

    return boardHTML;
}
