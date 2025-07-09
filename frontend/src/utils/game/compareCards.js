// frontend/src/utils/compareCards.js

import { getRank } from '../ai/aiPlayer'; // Assuming getRank is in aiPlayer.js or similar

function getSuit(card) {
  return card.slice(-1);
}

/**
 * Gets the hand type of a given set of cards (a dun).
 * @param {string[]} cards - An array of card strings.
 * @returns {string} The poker hand type (e.g., '散牌', '对子', '三条').
 */
export function getHandType(cards) {
  if (cards.length === 0) return '无牌';

  const rankCounts = {};
  for (const card of cards) {
    const rank = getRank(card);
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }

  const counts = Object.values(rankCounts);

  // Check for 同花 (Flush)
  const suits = cards.map(getSuit);
  const isFlush = new Set(suits).size === 1;
  if (isFlush) {
      // Check for 同花顺 (Straight Flush) later
      // Check for 皇家同花顺 (Royal Flush) later
       // If it's also a straight, it's a straight flush
       const ranks = Object.keys(rankCounts).map(Number).sort((a, b) => a - b);
       let isStraight = false;
       if (ranks.length === cards.length) { // Check for distinct ranks
           if (ranks.length > 0) {
             // Standard straight check
             isStraight = true;
             for (let i = 0; i < ranks.length - 1; i++) {
                 if (ranks[i+1] !== ranks[i] + 1) {
                     isStraight = false;
                     break;
                 }
             }
              // Handle Ace low straight (A, 2, 3, 4, 5) - specific to 5-card duns
             if (!isStraight && cards.length === 5 && ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
                isStraight = true;
            }
           }
       }
        if (isStraight) return '同花顺'; // Assuming no Royal Flush check needed separately for now
       return '同花';
  }

  if (counts.includes(3)) {
    return '三条';
  }

  const pairs = counts.filter(count => count === 2).length;
  if (pairs === 2) {
    return '两对';
  }
   if (pairs === 1) {
       return '对子';
   }

  // Check for 顺子 (Straight)
   const ranks = Object.keys(rankCounts).map(Number).sort((a, b) => a - b);
   let isStraight = false;
   if (ranks.length === cards.length) { // Check for distinct ranks
       if (ranks.length > 0) {
         // Standard straight check
         isStraight = true;
         for (let i = 0; i < ranks.length - 1; i++) {
             if (ranks[i+1] !== ranks[i] + 1) {
                 isStraight = false;
                 break;
             }
         }
          // Handle Ace low straight (A, 2, 3, 4, 5) - specific to 5-card duns
         if (!isStraight && cards.length === 5 && ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
            isStraight = true;
        }
       }
   }
  if (isStraight) return '顺子';



  // Add more hand types here later (葫芦, 四条, 同花顺)

  if (cards.length > 0) { // Only return 散牌 if there are cards
      return '散牌';
  }

  // Add more hand types here later (顺子, 同花, etc.)

  return '散牌';
}

/**
 * Compares two hands of the same type.
 * @param {string[]} hand1 - The first hand.
 * @param {string[]} hand2 - The second hand.
 * @param {string} handType - The type of hand (e.g., '对子', '三条').
 * @returns {number} 1 if hand1 is stronger, -1 if hand2 is stronger, 0 if equal.
 */
export function compareHands(hand1, hand2, handType) {
  if (handType === '对子') {
    const getPairRank = (hand) => {
      const rankCounts = {};
      for (const card of hand) {
        const rank = getRank(card);
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        if (rankCounts[rank] === 2) return rank;
      }
      return 0; // Should not happen for a pair
    };
    const rank1 = getPairRank(hand1);
    const rank2 = getPairRank(hand2);
    if (rank1 > rank2) return 1;
    if (rank2 > rank1) return -1;

    // Compare kickers
    const hand1Ranks = hand1.map(getRank).sort((a, b) => b - a);
    const hand2Ranks = hand2.map(getRank).sort((a, b) => b - a);
    const pairRank = getPairRank(hand1); // Rank of the pair

    // Find kicker(s) - ranks that are not the pair rank
    const kicker1 = hand1Ranks.filter(rank => rank !== pairRank);
    const kicker2 = hand2Ranks.filter(rank => rank !== pairRank);

    // Compare kickers from highest to lowest
    for (let i = 0; i < Math.min(kicker1.length, kicker2.length); i++) {
        if (kicker1[i] > kicker2[i]) return 1;
        if (kicker2[i] > kicker1) return -1;
    }
     // Should ideally not reach here if kickers are different lengths
    return 0;
  }

  if (handType === '三条') {
    const getThreeOfAKindRank = (hand) => {
      const rankCounts = {};
      for (const card of hand) {
        const rank = getRank(card);
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        if (rankCounts[rank] === 3) return rank;
      }
      return 0; // Should not happen for three of a kind
    };
    const rank1 = getThreeOfAKindRank(hand1);
    const rank2 = getThreeOfAKindRank(hand2);
    if (rank1 > rank2) return 1;
    if (rank2 > rank1) return -1;
    return 0;
  }

   if (handType === '两对') {
       const getTwoPairRanks = (hand) => {
            const rankCounts = {};
            for (const card of hand) {
                const rank = getRank(card);
                rankCounts[rank] = (rankCounts[rank] || 0) + 1;
            }
            const pairRanks = Object.keys(rankCounts).filter(rank => rankCounts[rank] === 2).map(Number).sort((a, b) => b - a); // Higher pair first
             const kicker = Object.keys(rankCounts).filter(rank => rankCounts[rank] === 1).map(Number)[0] || 0; // Only one kicker for 5-card two pair
            return { pairRanks, kicker };
       };

       const { pairRanks: pairRanks1, kicker: kicker1 } = getTwoPairRanks(hand1);
       const { pairRanks: pairRanks2, kicker: kicker2 } = getTwoPairRanks(hand2);

       // Compare higher pair
       if (pairRanks1[0] > pairRanks2[0]) return 1;
       if (pairRanks2[0] > pairRanks1[0]) return -1;

       // Compare lower pair
        if (pairRanks1[1] > pairRanks2[1]) return 1;
        if (pairRanks2[1] > pairRanks1[1]) return -1;

       // Compare kicker
        if (kicker1 > kicker2) return 1;
        if (kicker2 > kicker1) return -1;

       return 0;
   }

    if (handType === '顺子' || handType === '同花' || handType === '同花顺') {
        // For Straight, Flush, and Straight Flush, comparison is based on the highest card.
        // Handle Ace low straight (A, 2, 3, 4, 5) as lowest straight
        const getHighestRank = (hand) => {
             const ranks = hand.map(getRank).sort((a, b) => b - a);
              // Check for Ace low straight (A, 2, 3, 4, 5) and treat Ace as 1
             if (hand.length === 5 && ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
                 return 5; // Treat the highest card of A-5 straight as 5 for comparison
            }
            return ranks[0]; // Otherwise, highest card is the max rank
        };
        const rank1 = getHighestRank(hand1);
        const rank2 = getHighestRank(hand2);

        if (rank1 > rank2) return 1;
        if (rank2 > rank1) return -1;
        // For straights and flushes of the same highest card, it's a tie in most rules.
        // For straight flushes of the same rank, compare by suit (optional, usually Spade>Heart>Diamond>Club) - not implemented here.
         return 0;
    }

  if (handType === '散牌') {
    // Simple comparison for now: compare highest card
    const hand1Ranks = hand1.map(getRank).sort((a, b) => b - a);
    const hand2Ranks = hand2.map(getRank).sort((a, b) => b - a);

    // Compare cards from highest to lowest
    for (let i = 0; i < Math.min(hand1Ranks.length, hand2Ranks.length); i++) {
        if (hand1Ranks[i] > hand2Ranks[i]) return 1;
        if (hand2Ranks[i] > hand1Ranks[i]) return -1;
    }
     // If all cards are the same rank, it's a tie (shouldn't happen with distinct cards)
    if (rank1 > rank2) return 1;
    if (rank2 > rank1) return -1;

    // More detailed comparison needed for full implementation (compare next highest, etc.)
    return 0;
  }

  // Add comparison logic for other hand types here

  return 0; // Default for unrecognized types or equal hands
}

/**
 * Compares two duns (a set of cards for head, middle, or tail).
 * @param {string[]} dun1Player1 - The first player's dun cards.
 * @param {string[]} dun1Player2 - The second player's dun cards.
 * @param {string} dunType - The type of dun ('head', 'middle', or 'tail').
 * @returns {number} 1 if player 1's dun is stronger, -1 if player 2's dun is stronger, 0 if equal.
 */
export function compareDuns(dun1Player1, dun1Player2, dunType) {
  const handType1 = getHandType(dun1Player1);
  const handType2 = getHandType(dun1Player2);

  // Define hand type ranking (higher index is stronger)
  const handTypeRanking = ['无牌', '散牌', '对子', '两对', '三条', '顺子', '同花', '葫芦', '四条', '同花顺'];
  const rank1 = handTypeRanking.indexOf(handType1);
  const rank2 = handTypeRanking.indexOf(handType2);

  if (rank1 > rank2) return 1;
  if (rank2 > rank1) return -1;

  // If hand types are the same, compare based on the specific hand type
  return compareHands(dun1Player1, dun1Player2, handType1);
}