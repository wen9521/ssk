/**
 * card.js (Refactored for Drag-and-Drop)
 *
 * 这个模块现在包含为十三水游戏创建可拖拽卡牌的逻辑。
 */
import { playSound } from '../services/audio-service.js';

// --- 全局拖拽状态 ---
let draggedCard = null;

/**
 * 创建单个卡牌的HTML元素，并附加事件监听。
 * @param {object} card - 卡牌对象
 * @param {boolean} isDraggable - 卡牌是否可拖拽
 * @returns {HTMLElement}
 */
function createCardElement(card, isDraggable = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id; // 自定义数据属性，存储卡牌ID

    const cardImg = document.createElement('img');
    cardImg.src = `/assets/cards/${card.svg}`; // 假设card对象有svg属性
    cardImg.alt = card.fullName;
    cardImg.draggable = false; // 防止图像的默认拖拽行为
    cardDiv.appendChild(cardImg);

    if (isDraggable) {
        cardDiv.draggable = true;
        cardDiv.classList.add('draggable');
        cardDiv.addEventListener('dragstart', handleDragStart);
        cardDiv.addEventListener('dragend', handleDragEnd);
    } else {
        // 为斗地主等游戏保留简单的点击选择功能
        cardDiv.addEventListener('click', () => {
            if (document.querySelector('.doudizhu-board')) { // 仅在斗地主盘面生效
                playSound('selectCard');
                cardDiv.classList.toggle('selected');
            }
        });
    }

    return cardDiv;
}

// --- 拖拽事件处理 ---
function handleDragStart(e) {
    draggedCard = e.target.closest('.card');
    e.dataTransfer.setData('text/plain', draggedCard.dataset.cardId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        draggedCard.style.opacity = '0.5';
    }, 0);
}

function handleDragEnd() {
    if (draggedCard) {
        draggedCard.style.opacity = '1';
        draggedCard = null;
    }
}

/**
 * 为一个容器（如一个“墩”）添加拖放事件监听。
 * @param {HTMLElement} container - 容器元素
 * @param {function} onDropCallback - 放置成功后的回调函数
 */
export function makeDroppable(container, onDropCallback) {
    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // 必须，否则drop事件不会触发
        e.dataTransfer.dropEffect = 'move';
        container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        const cardId = e.dataTransfer.getData('text/plain');
        if (draggedCard && cardId === draggedCard.dataset.cardId) {
            if (onDropCallback(draggedCard, container)) {
                container.appendChild(draggedCard);
            }
        }
    });
}


/**
 * 渲染玩家的手牌到一个指定的容器中。
 * @param {string} containerId - 目标容器的ID
 * @param {Array<object>} hand - 手牌数组
 * @param {boolean} isDraggable - 是否可拖拽
 */
export function renderPlayerHand(containerId, hand, isDraggable = false) {
    const handContainer = document.getElementById(containerId);
    if (!handContainer) return;

    handContainer.innerHTML = '';
    hand.forEach(card => {
        const cardElement = createCardElement(card, isDraggable);
        handContainer.appendChild(cardElement);
    });
}

// --- 其他UI更新函数 ---

export function updateCardCount(playerId, count) {
    const countElement = document.querySelector(`#${playerId} .card-count b`);
    if (countElement) {
        countElement.textContent = count;
    }
}

export function renderPlayedCards(containerId, cards) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    cards.forEach(card => {
        const cardElement = createCardElement(card, false); // 打出的牌不可拖拽
        container.appendChild(cardElement);
    });
}
