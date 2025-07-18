// Function to render a single card
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id;

    const cardImg = document.createElement('img');
    cardImg.src = `/assets/cards/${card.id}`;
    cardImg.alt = card.fullName;
    
    cardDiv.appendChild(cardImg);
    
    cardDiv.addEventListener('click', () => {
        cardDiv.classList.toggle('selected');
    });

    return cardDiv;
}

// Function to render a player's entire hand
export function renderPlayerHand(playerId, hand) {
    const handContainer = document.getElementById(`hand-${playerId}`);
    if (!handContainer) return;

    handContainer.innerHTML = ''; // Clear previous hand
    hand.forEach(card => {
        const cardElement = createCardElement(card);
        handContainer.appendChild(cardElement);
    });
}
