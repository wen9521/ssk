import { createDeck, shuffleDeck } from './cardUtils';

export function getShuffledDeck() {
  const deck = createDeck();
  return shuffleDeck(deck);
}

export function dealHands(deck, numPlayers = 4) {
  const playerHands = Array(numPlayers).fill(null).map(() => []);
  for (let i = 0; i < 52; i++) {
    playerHands[i % numPlayers].push(deck[i]);
  }
  return playerHands;
}