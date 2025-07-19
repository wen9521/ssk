/**
 * card.js (Refactored for Drag-and-Drop)
 *
 * 这个模块现在包含为十三水游戏创建可拖拽卡牌的逻辑。
 */
import { playSound } from '../services/audio-service.js';

// Constants for card dimensions in Thirteen Water context
// These will be used for rendering stacked cards
const PAI_DUN_HEIGHT = 133; // This constant should ideally be in CSS or passed down
const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

let draggedCard = null; // The DOM element being dragged
let draggedCardId = null; // The ID of the card being dragged
let dragSourceArea = null; // The ID of the container where drag started (e.g., 'player-hand-area', 'front-dun')


/**
 * 创建单个卡牌的HTML元素，并附加拖拽事件监听（如果isDraggable为true）。
 * 这个函数不负责卡牌的选择或堆叠布局，只创建基本的卡牌DOM。
 * @param {object} card - 卡牌对象
 * @param {boolean} isDraggable - 卡牌是否可拖拽
 * @returns {HTMLElement}
 */
function createCardElement(card, isDraggable = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id; // 自定义数据属性，存储卡牌ID
    cardDiv.dataset.cardRank = card.rank; // For sorting if needed
    cardDiv.dataset.cardSuitKey = card.suit ? card.suit.key : ''; // For suit checks

    const cardImg = document.createElement('img');
    cardImg.src = `/assets/cards/${card.id}`; // card.id is the filename, e.g., '10_of_clubs.svg'
    cardImg.alt = card.fullName;
    cardImg.draggable = false; // Prevent default image drag
    cardDiv.appendChild(cardImg);

    if (isDraggable) {
        cardDiv.draggable = true;
        cardDiv.classList.add('draggable');
        cardDiv.addEventListener('dragstart', handleDragStart);
        cardDiv.addEventListener('dragend', handleDragEnd);
    }
    return cardDiv;
}

// --- Drag Event Handlers ---
function handleDragStart(e) {
    draggedCard = e.target.closest('.card'); // The actual DOM element being dragged
    draggedCardId = draggedCard.dataset.cardId;
    // Determine the source area. This needs to be passed down or inferred.
    // For simplicity now, let's assume parent is the source.
    dragSourceArea = draggedCard.parentElement ? draggedCard.parentElement.id : '';

    e.dataTransfer.setData('text/plain', draggedCardId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        draggedCard.style.opacity = '0.5';
    }, 0);
    // console.log('Drag Start:', draggedCardId, 'from', dragSourceArea);
}

function handleDragEnd() {
    if (draggedCard) {
        draggedCard.style.opacity = '1';
        // draggedCard = null; // Clear after render, not here.
        // draggedCardId = null;
        // dragSourceArea = null;
    }
    // console.log('Drag End');
}

/**
 * Renders a group of cards (hand or a dun) with a stacked/overlapped style.
 * Attaches click listeners for selection and drop listeners for moving cards.
 *
 * @param {HTMLElement} containerElement - The DOM element to render cards into (e.g., player-hand-area, dun-area)
 * @param {Array<object>} cards - Array of card objects to render
 * @param {string} areaId - The ID of the container element, used for selection tracking and drag source/target.
 * @param {Array<object>} selectedCards - Array of currently selected card objects for styling.
 * @param {function} onCardClick - Callback for when a card is clicked (for selection).
 * @param {function} onDropCard - Callback for when a card is dropped onto this container.
 * @param {object} [options={}] - Options for rendering:
 * @param {boolean} [options.isDraggable=false] - Whether cards in this container can be dragged.
 * @param {number} [options.cardWidth=CARD_WIDTH] - Override default card width.
 * @param {number} [options.cardHeight=CARD_HEIGHT] - Override default card height.
 * @param {number} [options.baseOverlapPercent=0.3] - Base overlap percentage (0 to 1).
 */
export function renderStackedCards(
    containerElement,
    cards,
    areaId,
    selectedCards = [],
    onCardClick,
    onDropCard,
    options = {}
) {
    // console.log(`Rendering ${areaId} with ${cards.length} cards.`, cards);
    if (!containerElement) return;

    containerElement.innerHTML = ''; // Clear previous cards

    const cardWidth = options.cardWidth || CARD_WIDTH;
    const cardHeight = options.cardHeight || CARD_HEIGHT;
    const baseOverlapPercent = options.baseOverlapPercent || 0.3; // 30% overlap by default

    let overlap = Math.floor(cardWidth * baseOverlapPercent);
    const paddingX = 16; // From React snippet's renderPaiDun
    // Use clientWidth - padding for accurate inner width calculation
    const containerInnerWidth = containerElement.clientWidth - paddingX; 

    if (cards.length > 1) {
        const totalCalculatedWidth = cardWidth + (cards.length - 1) * overlap;
        if (totalCalculatedWidth > containerInnerWidth && containerInnerWidth > cardWidth) {
            // Adjust overlap if cards extend beyond container
            overlap = Math.floor((containerInnerWidth - cardWidth) / (cards.length - 1));
            if (overlap < 0) overlap = 0; // Ensure overlap is not negative
        }
    } else {
        overlap = 0; // No overlap for single card
    }

    // Calculate left positions
    const lefts = cards.map((_, i) => i * overlap);

    // Render each card
    cards.forEach((card, idx) => {
        const cardDiv = createCardElement(card, options.isDraggable);

        const isCardSelected = selectedCards.some(sCard => sCard.id === card.id);
        if (isCardSelected) {
            cardDiv.classList.add('selected');
        }

        // Apply styles for stacked layout
        Object.assign(cardDiv.style, {
            position: 'absolute',
            left: `${lefts[idx]}px`,
            top: `${(containerElement.clientHeight - cardHeight) / 2}px`, // Vertically center
            zIndex: idx, // Ensure correct stacking order
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            borderRadius: '5px',
            background: 'var(--card-bg)', // Use CSS variable
            boxShadow: isCardSelected ? '0 0 16px 2px var(--accent-color)' : '0 1px 3px rgba(0,0,0,0.5)', // Use CSS var
            transition: 'transform 0.13s, box-shadow 0.13s, border 0.13s',
            border: isCardSelected ? '2.5px solid var(--accent-color)' : 'none', // Use CSS var
        });
        // Add hover effect for non-selected cards
        if (!isCardSelected) {
            cardDiv.onmouseover = () => { cardDiv.style.transform = 'translateY(-5px)'; };
            cardDiv.onmouseout = () => { cardDiv.style.transform = 'translateY(0)'; };
        } else {
             cardDiv.style.transform = 'translateY(-15px)'; // Selected cards lift up
        }


        // Attach click listener for selection
        if (onCardClick) {
            cardDiv.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent container click event from firing
                onCardClick(card, areaId, e);
            });
        }
        cardDiv.style.cursor = onCardClick ? 'pointer' : 'default';


        containerElement.appendChild(cardDiv);
    });

    // Attach drag-and-drop listeners to the container
    containerElement.addEventListener('dragover', (e) => {
        e.preventDefault(); // Crucial for drop to fire
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
            onDropCard(draggedCardId, dragSourceArea, areaId); // Pass card ID, source area, target area
            // After drop, reset dragged card state
            draggedCard = null;
            draggedCardId = null;
            dragSourceArea = null;
        }
    });

    // Add CSS class for droppable effect if it's a dun area
    if (areaId.includes('dun')) {
        containerElement.classList.add('droppable-dun');
    }
}


/**
 * Renders player's hand for Doudizhu (not Thirteen Water stacked style).
 * @param {string} containerId - The ID of the container element.
 * @param {Array<object>} hand - Array of card objects.
 * @param {boolean} isHidden - If cards should be faced down.
 */
export function renderPlayerHand(containerId, hand, isHidden = false) {
    const handContainer = document.getElementById(containerId);
    if (!handContainer) return;

    handContainer.innerHTML = ''; // Clear previous cards
    if (isHidden) {
        handContainer.classList.add('hidden'); // Apply class for hidden card styling
    } else {
        handContainer.classList.remove('hidden');
    }

    hand.forEach(card => {
        const cardElement = createCardElement(card, false); // Doudizhu cards are not draggable by default
        if (isHidden) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardElement.innerHTML = ''; // Clear original image
            cardElement.appendChild(cardBack);
        }
        handContainer.appendChild(cardElement);
    });
}


// --- Other UI update functions (remain mostly the same) ---

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
        const cardElement = createCardElement(card, false); // Played cards are not draggable
        container.appendChild(cardElement);
    });
}
