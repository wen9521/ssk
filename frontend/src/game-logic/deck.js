// src/game-logic/deck.js

const SUITS = ['s', 'h', 'd', 'c'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

/**
 * Creates a standard 52-card deck.
 * @returns {string[]} An array of card strings, e.g., ['2s', '3s', ...].
 */
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      // Using a consistent format: Rank then Suit (e.g., 'As', 'Th', '2c')
      deck.push(rank + suit);
    }
  }
  return deck;
}

/**
 * Shuffles a deck of cards using the Fisher-Yates algorithm.
 * @param {string[]} deck The deck to shuffle.
 * @returns {string[]} A new array containing the shuffled deck.
 */
function shuffleDeck(deck) {
  // Create a copy to avoid modifying the original array
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Export the functions so they can be imported elsewhere
export { createDeck, shuffleDeck };
