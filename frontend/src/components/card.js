/**
 * card.js (Refactored for Drag-and-Drop)
 *
 * 这个模块现在包含为十三水游戏创建可拖拽卡牌的逻辑。
 */
import { playSound } from '../services/audio-service.js';

// Constants for card dimensions in Thirteen Water context
const PAI_DUN_HEIGHT = 133;
const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

let draggedCard = null;
let draggedCardId = null;
let dragSourceArea = null;

function createCardElement(card, isDraggable = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id;
    cardDiv.dataset.cardRank = card.rank;
    cardDiv.dataset.cardSuitKey = card.suit ? card.suit.key : '';

    const cardImg = document.createElement('img');
    cardImg.src = `/assets/cards/${card.id}`;
    cardImg.alt = card.fullName;
    cardImg.draggable = false;
    cardDiv.appendChild(cardImg);

    if (isDraggable) {
        cardDiv.draggable = true;
        cardDiv.classList.add('draggable');
        cardDiv.addEventListener('dragstart', handleDragStart);
        cardDiv.addEventListener('dragend', handleDragEnd);
    }
    return cardDiv;
}

function handleDragStart(e) {
    draggedCard = e.target.closest('.card');
    draggedCardId = draggedCard.dataset.cardId;
    dragSourceArea = draggedCard.parentElement ? draggedCard.parentElement.id : '';
    e.dataTransfer.setData('text/plain', draggedCardId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        draggedCard.style.opacity = '0.5';
    }, 0);
}

function handleDragEnd() {
    if (draggedCard) {
        draggedCard.style.opacity = '1';
    }
}

export function renderStackedCards(
    containerElement,
    cards,
    areaId,
    selectedCards = [],
    onCardClick,
    onDropCard,
    options = {}
) {
    if (!containerElement) return;
    containerElement.innerHTML = '';
    const cardWidth = options.cardWidth || CARD_WIDTH;
    const cardHeight = options.cardHeight || CARD_HEIGHT;
    const baseOverlapPercent = options.baseOverlapPercent || 0.3;

    let overlap = Math.floor(cardWidth * baseOverlapPercent);
    const paddingX = 16;
    const containerInnerWidth = containerElement.clientWidth - paddingX;
    if (cards.length > 1) {
        const totalCalculatedWidth = cardWidth + (cards.length - 1) * overlap;
        if (totalCalculatedWidth > containerInnerWidth && containerInnerWidth > cardWidth) {
            overlap = Math.floor((containerInnerWidth - cardWidth) / (cards.length - 1));
            if (overlap < 0) overlap = 0;
        }
    } else {
        overlap = 0;
    }
    const lefts = cards.map((_, i) => i * overlap);
    cards.forEach((card, idx) => {
        const cardDiv = createCardElement(card, options.isDraggable);
        const isCardSelected = selectedCards.some(sCard => sCard.id === card.id);
        if (isCardSelected) {
            cardDiv.classList.add('selected');
        }
        Object.assign(cardDiv.style, {
            position: 'absolute',
            left: `${lefts[idx]}px`,
            top: `${(containerElement.clientHeight - cardHeight) / 2}px`,
            zIndex: idx,
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            borderRadius: '5px',
            background: 'var(--card-bg)',
            boxShadow: isCardSelected ? '0 0 16px 2px var(--accent-color)' : '0 1px 3px rgba(0,0,0,0.5)',
            transition: 'transform 0.13s, box-shadow 0.13s, border 0.13s',
            border: isCardSelected ? '2.5px solid var(--accent-color)' : 'none',
        });
        if (!isCardSelected) {
            cardDiv.onmouseover = () => { cardDiv.style.transform = 'translateY(-5px)'; };
            cardDiv.onmouseout = () => { cardDiv.style.transform = 'translateY(0)'; };
        } else {
             cardDiv.style.transform = 'translateY(-15px)';
        }
        if (onCardClick) {
            cardDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                onCardClick(card, areaId, e);
            });
        }
        cardDiv.style.cursor = onCardClick ? 'pointer' : 'default';
        containerElement.appendChild(cardDiv);
    });
    containerElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        containerElement.classList.add('drag-over');
    });
    containerElement.addEventListener('dragleave', () => {
        containerElement.classList.remove('drag-over');
    });
    containerElement.addEventListener('drop', (e) => {
        e.preventDefault();
        containerElement.classList.remove('drag-over');
        const droppedCardId = e.dataTransfer.getData('text/plain');
        if (draggedCardId && droppedCardId === draggedCardId && onDropCard) {
            onDropCard(draggedCardId, dragSourceArea, areaId);
            draggedCard = null;
            draggedCardId = null;
            dragSourceArea = null;
        }
    });
    if (areaId.includes('dun')) {
        containerElement.classList.add('droppable-dun');
    }
}

export function renderPlayerHand(containerId, hand, isHidden = false) {
    const handContainer = document.getElementById(containerId);
    if (!handContainer) return;
    handContainer.innerHTML = '';
    if (isHidden) {
        handContainer.classList.add('hidden');
    } else {
        handContainer.classList.remove('hidden');
    }
    hand.forEach(card => {
        const cardElement = createCardElement(card, false);
        if (isHidden) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardElement.innerHTML = '';
            cardElement.appendChild(cardBack);
        }
        handContainer.appendChild(cardElement);
    });
}

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
        const cardElement = createCardElement(card, false);
        container.appendChild(cardElement);
    });
}
