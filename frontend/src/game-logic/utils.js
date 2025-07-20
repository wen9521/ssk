
// frontend/src/game-logic/utils.js

export function rankToScore(rank) {
  const scores = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return scores[rank];
}

export function cardToRankAndSuit(card) {
  return {
    rank: card.slice(0, -1),
    suit: card.slice(-1)
  };
}
