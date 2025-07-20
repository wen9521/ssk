// frontend/src/game-logic/deck.js

export function createDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
  const deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return deck;
}

export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
  }
  return deck;
}

export function dealCards(shuffledDeck, numPlayers, numCardsPerPlayer) {
  const hands = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push([]);
  }

  let currentCardIndex = 0;
  for (let i = 0; i < numCardsPerPlayer; i++) {
    for (let j = 0; j < numPlayers; j++) {
      if (currentCardIndex < shuffledDeck.length) {
        hands[j].push(shuffledDeck[currentCardIndex]);
        currentCardIndex++;
      }
    }
  }

  return hands;
}
