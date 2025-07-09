// frontend/src/utils/aiPlayer.js

/**
 * Gets the rank value of a card.
 * @param {string} card - Card string (e.g., 'A♠', '10♥').
 * @returns {number} Rank value (2-14, 14 for Ace).
 */
export function getRank(card) { // <--- 添加了 export
  if (!card || typeof card !== 'string' || card.length < 2) {
    // 添加健壮性检查，防止处理无效的 card 字符串
    return 0; 
  }
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
      return parseInt(rank, 10) || 0; // 保证返回一个数字
  }
}

/**
 * Checks if a set of cards contains a pair.
 * @param {string[]} cards - Array of card strings.
 * @returns {boolean} True if a pair is present, false otherwise.
 */
export function isPair(cards) { // <--- 添加了 export
  if (!cards || cards.length < 2) return false;
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
export function isThreeOfAKind(cards) { // <--- 添加了 export
  if (!cards || cards.length < 3) return false;
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
 * This is a very basic "dummy" AI.
 * @param {string[]} hand - An array of 13 card strings.
 * @returns {{dun1: string[], dun2: string[], dun3: string[]}} An object containing the three duns.
 */
export function arrangeCardsForAI(hand) {
  if (!hand || hand.length !== 13) {
    console.error("Invalid hand for AI arrangement:", hand);
    // Return empty duns or throw an error, depending on desired behavior
    return { dun1: [], dun2: [], dun3: [] };
  }

  // A very simple arrangement: just slice the array.
  const dun1 = hand.slice(0, 3);
  const dun2 = hand.slice(3, 8);
  const dun3 = hand.slice(8, 13);

  return {
    dun1,
    dun2,
    dun3,
  };
}
