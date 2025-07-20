
// frontend/src/utils/card-utils.js

const rankMap = {
  'A': 'ace', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', 'T': '10', 'J': 'jack', 'Q': 'queen', 'K': 'king'
};

const suitMap = {
  's': 'spades',
  'h': 'hearts',
  'd': 'diamonds',
  'c': 'clubs'
};

export function toCardFilename(card) {
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  return `${rankMap[rank]}_of_${suitMap[suit]}`;
}
