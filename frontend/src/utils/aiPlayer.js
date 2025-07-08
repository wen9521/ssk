// frontend/src/utils/aiPlayer.js

/**
 * Gets the rank value of a card.
 * @param {string} card - Card string (e.g., 'A♠', '10♥').
 * @returns {number} Rank value (2-14, 14 for Ace).
 */
function getRank(card) {
  const rank = card.substring(0, card.length - 1);
  switch (rank) {
    case 'A':
      return 14;
    case 'K':
      return 13;
    case 'Q':
      return 12;
    case 'J':
      return 11;
    default:
      return parseInt(rank, 10);
  }
}

/**
 * Checks if a set of cards contains a pair.
 * @param {string[]} cards - Array of card strings.
 * @returns {boolean} True if a pair is present, false otherwise.
 */
function isPair(cards) {
  if (cards.length < 2) return false;
  const ranks = cards.map(getRank);
  const rankCounts = {};
  for (const rank of ranks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    if (rankCounts[rank] >= 2) return true;
  }
  return false;
}

/**
 * Checks if a set of cards contains three of a kind.
 * @param {string[]} cards - Array of card strings.
 * @returns {boolean} True if three of a kind is present, false otherwise.
 */
function isThreeOfAKind(cards) {
  if (cards.length < 3) return false;
  const ranks = cards.map(getRank);
  const rankCounts = {};
  for (const rank of ranks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    if (rankCounts[rank] >= 3) return true;
  }
  return false;
}

/**
 * Arranges a 13-card hand into three duns (3, 5, 5) for an AI player.
 *
 * @param {string[]} hand - An array of 13 card strings.
 * @returns {{dun1: string[], dun2: string[], dun3: string[]}} An object containing the three duns.
 */
export function arrangeCardsForAI(hand) {
  if (!hand || hand.length !== 13) {
    console.error("Invalid hand for AI arrangement:", hand);
    // Return empty duns or throw an error, depending on desired behavior
    return { dun1: [], dun2: [], dun3: [] };
  }

  const dun1 = hand.slice(0, 3);
  const dun2 = hand.slice(3, 8);
  const dun3 = hand.slice(8, 13);

  return {
    dun1,
    dun2,
    dun3,
  };
}