/**
 * card.js
 * 
 * 这个模块负责所有与卡牌UI相关的DOM操作。
 * - 创建卡牌元素。
 * - 渲染玩家手牌。
 * - 更新UI显示。
 */


/**
 * 创建单个卡牌的HTML元素。
 * @param {object} card - 卡牌对象，包含id, fullName等信息。
 * @param {boolean} isPlayerCard - 是否是真人玩家的牌，决定是否添加点击事件。
 * @returns {HTMLElement} - 创建好的卡牌div元素。
 */
function createCardElement(card, isPlayerCard = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id; // 将卡牌ID存储在DOM中，方便后续逻辑获取

    const cardImg = document.createElement('img');
    // 图片路径相对于网站根目录
    cardImg.src = `/assets/cards/${card.id}`;
    cardImg.alt = card.fullName;
    cardImg.draggable = false; // 防止图片被意外拖动
    
    cardDiv.appendChild(cardImg);
    
    // 只为真人玩家的牌添加点击事件，以切换选中状态
    if (isPlayerCard) {
        cardDiv.addEventListener('click', () => {
            cardDiv.classList.toggle('selected');
        });
    }

    return cardDiv;
}

/**
 * 渲染指定玩家的完整手牌。
 * @param {string} playerId - 玩家ID，用于定位正确的DOM容器。
 * @param {Array<object>} hand - 该玩家的手牌对象数组。
 * @param {boolean} isPlayer - 是否是真人玩家，用于传递给createCardElement。
 */
export function renderPlayerHand(playerId, hand, isPlayer = false) {
    const handContainer = document.getElementById(`hand-${playerId}`);
    if (!handContainer) {
        console.error(`Could not find hand container for player: ${playerId}`);
        return;
    }

    // 清空旧的手牌，准备渲染新的
    handContainer.innerHTML = ''; 
    
    // 遍历手牌数组，为每张牌创建元素并附加到容器中
    hand.forEach((card, index) => {
        const cardElement = createCardElement(card, isPlayer);
        // 添加一个 staggered (交错的) 动画延迟，实现发牌或理牌的视觉效果
        cardElement.style.animation = `cardFlyIn 0.5s ${index * 0.05}s ease-out both`;
        handContainer.appendChild(cardElement);
    });
}

/**
 * 更新指定玩家的剩余牌数显示。
 * @param {string} playerId - 玩家ID。
 * @param {number} count - 剩余的牌数。
 */
export function updateCardCount(playerId, count) {
    const countElement = document.getElementById(`card-count-${playerId}`);
    if (countElement) {
        countElement.textContent = count;
    }
}

/**
 * 在中央出牌区显示打出的牌，并可以附带出牌者信息。
 * @param {Array<object>} cards - 打出的牌的对象数组。
 * @param {string} playerName - 出牌者的名字或状态（如“不要”）。
 */
export function renderPlayedCards(cards, playerName = '') {
    const container = document.getElementById('played-cards-area');
    const infoElement = document.getElementById('played-cards-info');
    
    if (!container || !infoElement) {
        console.error('Played cards area or info element not found in the DOM.');
        return;
    }
    
    // 更新出牌信息文本
    infoElement.textContent = playerName;
    // 清空上一次的出牌
    container.innerHTML = '';

    // 如果没有出牌（比如pass），则直接返回
    if (!cards || cards.length === 0) {
        return;
    }

    // 渲染打出的牌
    cards.forEach((card, index) => {
        const cardElement = createCardElement(card, false); // 在出牌区的牌不能被点击
        // 使用一个简单的淡入动画
        cardElement.style.animation = `fadeIn 0.3s ${index * 0.05}s ease-out both`;
        container.appendChild(cardElement);
    });
}
