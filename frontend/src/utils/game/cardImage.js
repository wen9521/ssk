// frontend/src/utils/game/cardImage.js

// 牌面英文映射
const rankMap = {
  'A': 'ace',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'jack',
  'Q': 'queen',
  'K': 'king'
};

const suitMap = {
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
  'S': 'spades',
  'H': 'hearts',
  'D': 'diamonds',
  'C': 'clubs'
};

export function getCardImageUrl(card) {
  // ✅ FIX: Handle cards formatted as "value_of_suit" (e.g., "ace_of_spades", "10_of_clubs")
  if (typeof card === 'string' && card.includes('_of_')) {
    // Assuming card is like "rank_of_suit" (e.g., "ace_of_clubs")
    // Directly form the image URL for these cases.
    // Example: "ace_of_clubs" -> "/cards/ace_of_clubs.svg"
    return `/cards/${card}.svg`;
  }

  // Original robust error handling and default for invalid inputs
  if (!card || typeof card !== 'string' || card.length < 2) {
    return '/cards/red_joker.svg'; // Default image for unparsable or invalid cards
  }

  // Original logic for compact card notation (e.g., "A♠", "10♣", "AS", "TH")
  let rank = card.slice(0, card.length - 1).toUpperCase();
  let suit = card.slice(-1).toUpperCase();

  // Special handling for '10' to ensure correct rank extraction when input is like "10S"
  if (card.length >= 3 && card.startsWith('10')) {
    rank = '10';
    suit = card.slice(2).toUpperCase(); // Get the character after '10' as suit
  }


  const fileName = `${rankMap[rank]}_of_${suitMap[suit]}.svg`;
  
  // Fallback for cases where rank or suit mapping fails for the compact notation
  if (!rankMap[rank] || !suitMap[suit]) {
    return '/cards/red_joker.svg';
  }

  return `/cards/${fileName}`;
}
