// src/game-logic/deck.js

const SUITS = ['s', 'h', 'd', 'c'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export function getShuffledDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(rank + suit);
    }
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealHands(deck) {
  const hands = [[], [], [], []];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 4; j++) {
      hands[j].push(deck[i * 4 + j]);
    }
  }
  return hands;
}
