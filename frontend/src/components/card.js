// Function to render a single card
function createCardElement(card, isPlayerCard = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id;

    const cardImg = document.createElement('img');
    cardImg.src = `/assets/cards/${card.id}`;
    cardImg.alt = card.fullName;
    
    cardDiv.appendChild(cardImg);
    
    // 只为真人玩家的牌添加点击事件
    if (isPlayerCard) {
        cardDiv.addEventListener('click', () => {
            cardDiv.classList.toggle('selected');
        });
    }

    return cardDiv;
}

// Function to render a player's entire hand with animation
export function renderPlayerHand(playerId, hand, isPlayer = false) {
    const handContainer = document.getElementById(`hand-${playerId}`);
    if (!handContainer) return;

    handContainer.innerHTML = ''; // Clear previous hand
    hand.forEach((card, index) => {
        const cardElement = createCardElement(card, isPlayer);
        // 添加动画延迟，实现发牌效果
        cardElement.style.animation = `cardFlyIn 0.5s ${index * 0.05}s ease-out both`;
        handContainer.appendChild(cardElement);
    });
}

// 更新牌数显示
export function updateCardCount(playerId, count) {
    const countElement = document.getElementById(`card-count-${playerId}`);
    if (countElement) {
        countElement.textContent = count;
    }
}

// 在出牌区显示出牌
export function renderPlayedCards(cards) {
    const container = document.getElementById('played-cards-area');
    container.innerHTML = '';
    cards.forEach((card, index) => {
        const cardElement = createCardElement(card, false);
        cardElement.style.animation = `fadeIn 0.3s ${index * 0.05}s ease-out both`;
        container.appendChild(cardElement);
    });
}
