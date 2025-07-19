/**
 * card.js (斗地主横向堆叠手牌)
 */
import { playSound } from '../services/audio-service.js';

// Constants for card dimensions
const CARD_HEIGHT = 94;
const CARD_WIDTH = 66;
const DDZ_HAND_OVERLAP = 0.42; // 斗地主手牌重叠度

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
    // 仅十三水用，斗地主不用。
    e.dataTransfer.setData('text/plain', e.target.dataset.cardId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        e.target.style.opacity = '0.5';
    }, 0);
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
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
    const baseOverlapPercent = options.baseOverlapPercent ?? DDZ_HAND_OVERLAP;

    let overlap = Math.floor(cardWidth * baseOverlapPercent);
    if (cards.length > 1) {
        const totalCalculatedWidth = cardWidth + (cards.length - 1) * overlap;
        if (totalCalculatedWidth > containerElement.clientWidth - 16) {
            overlap = Math.floor((containerElement.clientWidth - 16 - cardWidth) / (cards.length - 1));
            if (overlap < 0) overlap = 0;
        }
    } else {
        overlap = 0;
    }
    const lefts = cards.map((_, i) => i * overlap);

    containerElement.style.position = 'relative';
    containerElement.style.height = `${cardHeight + 6}px`;

    cards.forEach((card, idx) => {
        const cardDiv = createCardElement(card, options.isDraggable);
        const isCardSelected = selectedCards.some(sCard => sCard.id === card.id);
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = `${lefts[idx]}px`;
        cardDiv.style.bottom = '0px';
        cardDiv.style.zIndex = idx;
        cardDiv.style.width = `${cardWidth}px`;
        cardDiv.style.height = `${cardHeight}px`;
        cardDiv.style.borderRadius = '5px';
        cardDiv.style.background = 'var(--card-bg)';
        cardDiv.style.boxShadow = isCardSelected ? '0 0 16px 2px var(--accent-color)' : '0 1px 3px rgba(0,0,0,0.5)';
        cardDiv.style.transition = 'transform 0.13s, box-shadow 0.13s, border 0.13s';
        cardDiv.style.border = isCardSelected ? '2.5px solid var(--accent-color)' : 'none';
        cardDiv.style.cursor = onCardClick ? 'pointer' : 'default';
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
                cardDiv.classList.toggle('selected');
            });
        }
        containerElement.appendChild(cardDiv);
    });

    // 拖拽功能仅十三水用
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
    // 斗地主用横向堆叠方式
    renderStackedCards(handContainer, hand, 'hand', [], null, null, { cardWidth: CARD_WIDTH, cardHeight: CARD_HEIGHT, baseOverlapPercent: DDZ_HAND_OVERLAP });
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
    renderStackedCards(container, cards, 'play', [], null, null, { cardWidth: CARD_WIDTH, cardHeight: CARD_HEIGHT, baseOverlapPercent: DDZ_HAND_OVERLAP });
}
