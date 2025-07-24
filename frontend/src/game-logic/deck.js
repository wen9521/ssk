// frontend/src/game-logic/deck.js

const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const suits = ['clubs', 'diamonds', 'hearts', 'spades'];

// Create a standard 52-card deck
export function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

// Shuffle the deck using the Fisher-Yates algorithm
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards to players
export function dealCards(deck, numCards, numPlayers) {
  const hands = Array(numPlayers).fill(null).map(() => []);
  const remainingDeck = [...deck];
  
  for (let i = 0; i < numCards; i++) {
    for (let j = 0; j < numPlayers; j++) {
      if(remainingDeck.length > 0) {
        hands[j].push(remainingDeck.pop());
      }
    }
  }

  return [ ...hands, remainingDeck ];
}
