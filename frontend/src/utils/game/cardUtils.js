// src/utils/game/cardUtils.js

// --- [FIXED] Use 'T' for 10 to ensure consistency across the app ---
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
const SUITS = ['S', 'H', 'D', 'C']; // Use single letters for suits for simplicity

/**
 * Creates a standard 52-card deck.
 * @returns {string[]} e.g., ["AS", "KS", ...]
 */
export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

/**
 * Shuffles a deck using the Fisher-Yates algorithm.
 * @param {string[]} deck - The deck to shuffle.
 * @returns {string[]} The shuffled deck.
 */
export function shuffleDeck(deck) {
  if (!deck || !Array.isArray(deck)) return [];
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deals cards to a specified number of players.
 * @param {number} numPlayers - The number of players.
 * @returns {{fullDeck: string[], playerHands: string[][]}}
 */
export function dealCards(numPlayers = 4) {
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  
  const playerHands = Array(numPlayers).fill(null).map(() => []);

  for (let i = 0; i < 52; i++) {
    if (playerHands[i % numPlayers]) {
      playerHands[i % numPlayers].push(shuffledDeck[i]);
    }
  }

  return {
    fullDeck: shuffledDeck, 
    playerHands: playerHands
  };
}

/**
 * Gets the numerical rank of a card.
 * @param {string} card - e.g., 'AS', 'TH'.
 * @returns {number} Rank value (Ace=14, King=13, ..., 2=2).
 */
export function getRank(card) {
  if (!card || typeof card !== 'string' || card.length < 2) return 0;
  const rankStr = card.slice(0, -1);
  switch (rankStr) {
    case 'A': return 14;
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    case 'T': return 10;
    default: return parseInt(rankStr, 10) || 0;
  }
}

/**
 * Gets the suit of a card.
 * @param {string} card - e.g., 'AS'
 * @returns {string} Suit symbol e.g., 'S'
 */
export function getSuit(card) {
    if (!card || typeof card !== 'string' || card.length < 2) return '';
    return card.slice(-1);
}

/**
 * Determines the hand type of a set of cards.
 * @param {string[]} cards - An array of cards.
 * @returns {string} The name of the hand type.
 */
export function getHandType(cards) {
    if (!cards || !Array.isArray(cards) || cards.length === 0) return "无";
    
    const ranks = cards.map(getRank).sort((a, b) => a - b);
    const suits = cards.map(getSuit);

    const rankCounts = ranks.reduce((acc, rank) => { acc[rank] = (acc[rank] || 0) + 1; return acc; }, {});
    const counts = Object.values(rankCounts);
    
    const isFlush = new Set(suits).size === 1;
    const isStraight = (() => {
        const uniqueRanks = [...new Set(ranks)];
        if (uniqueRanks.length !== cards.length) return false;
        // Ace-low straight (A-2-3-4-5)
        if (JSON.stringify(uniqueRanks) === JSON.stringify([2, 3, 4, 5, 14])) return true;
        // Normal straight
        if (uniqueRanks[uniqueRanks.length - 1] - uniqueRanks[0] === cards.length - 1) return true;
        return false;
    })();
    
    if (cards.length === 5) {
        if (isStraight && isFlush) return "同花顺";
        if (counts.includes(4)) return "铁支";
        if (counts.includes(3) && counts.includes(2)) return "葫芦";
        if (isFlush) return "同花";
        if (isStraight) return "顺子";
    }

    if (counts.includes(3)) return "三条";
    if (counts.filter(c => c === 2).length === 2) return "两对";
    if (counts.includes(2)) return "对子";
    
    return "散牌";
}

/**
 * Compares two hands of the same type.
 * @returns {number} 1 if hand1 > hand2, -1 if hand1 < hand2, 0 if equal.
 */
export function compareHands(hand1, hand2) {
    if (!hand1 || !hand2 || hand1.length === 0 || hand2.length === 0) return 0;
    const ranks1 = hand1.map(getRank).sort((a, b) => b - a);
    const ranks2 = hand2.map(getRank).sort((a, b) => b - a);
    for (let i = 0; i < ranks1.length; i++) {
        if (ranks1[i] !== ranks2[i]) {
            return ranks1[i] > ranks2[i] ? 1 : -1;
        }
    }
    return 0;
}

/**
 * Checks if a set of three duns is foul.
 * @returns {boolean} true if foul, false otherwise.
 */
export function isFoul(dun1, dun2, dun3) {
    if (!dun1 || !dun2 || !dun3 || dun1.length !== 3 || dun2.length !== 5 || dun3.length !== 5) {
      return false; 
    }

    const handTypes = ["无", "散牌", "对子", "两对", "三条", "顺子", "同花", "葫芦", "铁支", "同花顺"];
    
    const type1 = getHandType(dun1);
    const type2 = getHandType(dun2);
    const type3 = getHandType(dun3);

    const rank1 = handTypes.indexOf(type1);
    const rank2 = handTypes.indexOf(type2);
    const rank3 = handTypes.indexOf(type3);

    if (rank1 > rank2 || rank2 > rank3) return true;
    if (rank1 === rank2 && compareHands(dun1, dun2) > 0) return true;
    if (rank2 === rank3 && compareHands(dun2, dun3) > 0) return true;

    return false;
}
