/**
 * card.js
 * 
 * 这个模块负责所有与卡牌UI相关的DOM操作。
 */

/**
 * 创建单个卡牌的HTML元素。
 * @param {object} card - 卡牌对象
 * @param {boolean} isPlayerCard - 是否是真人玩家的牌
 * @returns {HTMLElement}
 */
function createCardElement(card, isPlayerCard = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id;

    const cardImg = document.createElement('img');
    cardImg.src = `/assets/cards/${card.id}`;
    cardImg.alt = card.fullName;
    cardImg.draggable = false;
    
    cardDiv.appendChild(cardImg);
    
    if (isPlayerCard) {
        cardDiv.addEventListener('click', () => {
            cardDiv.classList.toggle('selected');
        });
    }

    return cardDiv;
}

/**
 * 渲染指定玩家的完整手牌。
 * @param {string} playerId - 玩家ID
 * @param {Array<object>} hand - 手牌数组
 * @param {boolean} isPlayer - 是否是真人玩家
 */
export function renderPlayerHand(playerId, hand, isPlayer = false) {
    const handContainer = document.getElementById(`hand-${playerId}`);
    if (!handContainer) return;

    handContainer.innerHTML = ''; 
    hand.forEach((card, index) => {
        const cardElement = createCardElement(card, isPlayer);
        cardElement.style.animation = `cardFlyIn 0.5s ${index * 0.05}s ease-out both`;
        handContainer.appendChild(cardElement);
    });
}

/**
 * 更新指定玩家的剩余牌数显示。
 * @param {string} playerId - 玩家ID
 * @param {number} count - 剩余牌数
 */
export function updateCardCount(playerId, count) {
    const countElement = document.getElementById(`card-count-${playerId}`);
    if (countElement) {
        countElement.textContent = count;
    }
}

/**
 * 通用的卡牌渲染函数，可以向任何指定容器渲染卡牌。
 * @param {string} containerId - 目标容器的ID
 * @param {Array<object>} cards - 要渲染的卡牌数组
 */
export function renderPlayedCards(containerId, cards) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Render container with id "${containerId}" not found.`);
        return;
    }
    
    container.innerHTML = '';
    if (!cards || cards.length === 0) return;

    cards.forEach((card, index) => {
        const cardElement = createCardElement(card, false);
        cardElement.style.animation = `fadeIn 0.3s ${index * 0.05}s ease-out both`;
        container.appendChild(cardElement);
    });
}
