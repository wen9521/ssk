// frontend/src/game-logic/thirteen-water.js
import { SmartSplit, isFoulForAI } from './ai-logic.js';
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const suits = ['clubs', 'diamonds', 'hearts', 'spades'];

const handTypeRank = {
  'straight flush': 9,
  'four of a kind': 8,
  'full house': 7,
  'flush': 6,
  'straight': 5,
  'three of a kind': 4,
  'two pair': 3,
  'pair': 2,
  'high card': 1,
};

// Get the numerical value of a card
export function getCardValue(card) {
  return ranks.indexOf(card.rank);
}

// Sort cards by rank
export function sortCards(cards) {
  return [...cards].sort((a, b) => getCardValue(a) - getCardValue(b));
}

// Check for a flush
function isFlush(hand) {
  if (hand.length === 0) return false;
  const suit = hand[0].suit;
  return hand.every((card) => card.suit === suit);
}

// Check for a straight
function isStraight(hand) {
  if (hand.length < 5) return false; // A straight needs at least 5 cards
  const sortedHand = sortCards(hand);
  for (let i = 0; i < sortedHand.length - 1; i++) {
    if (getCardValue(sortedHand[i + 1]) - getCardValue(sortedHand[i]) !== 1) {
      // Handle Ace-low straight (A, 2, 3, 4, 5)
      if (sortedHand[0].rank === '2' && sortedHand[1].rank === '3' && 
          sortedHand[2].rank === '4' && sortedHand[3].rank === '5' && 
          sortedHand[4].rank === 'A') {
            return true;
          }
      return false;
    }
  }
  return true;
}

// Get the counts of each rank in a hand
function getRankCounts(hand) {
  return hand.reduce((counts, card) => {
    counts[card.rank] = (counts[card.rank] || 0) + 1;
    return counts;
  }, {});
}

// Get the type of a hand (e.g., 'pair', 'three of a kind')
export function getHandType(hand) {
  if (hand.length === 0) return 'high card';

  const counts = getRankCounts(hand);
  const values = Object.values(counts);
  const uniqueRanks = Object.keys(counts).length;
  const hasFour = values.includes(4);
  const hasThree = values.includes(3);
  const numPairs = values.filter((v) => v === 2).length;
  const flush = isFlush(hand);
  const straight = isStraight(hand);

  if (flush && straight) return 'straight flush';
  if (hasFour) return 'four of a kind';
  if (hasThree && numPairs === 1) return 'full house';
  if (flush) return 'flush';
  if (straight) return 'straight';
  if (hasThree) return 'three of a kind';
  if (numPairs === 2) return 'two pair';
  if (numPairs === 1) return 'pair';

  return 'high card';
}

// Compare two hands
export function compareHands(hand1, hand2) {
  const type1 = getHandType(hand1);
  const type2 = getHandType(hand2);

  // First, compare by hand type rank
  if (handTypeRank[type1] > handTypeRank[type2]) return 1;
  if (handTypeRank[type1] < handTypeRank[type2]) return -1;

  // If hand types are the same, compare by card values
  const sortedHand1 = sortCards(hand1);
  const sortedHand2 = sortCards(hand2);

  switch (type1) {
    case 'high card':
    case 'flush':
    case 'straight':
    case 'straight flush':
      // Compare highest card first, then next highest, etc.
      for (let i = sortedHand1.length - 1; i >= 0; i--) {
        if (getCardValue(sortedHand1[i]) > getCardValue(sortedHand2[i])) return 1;
        if (getCardValue(sortedHand1[i]) < getCardValue(sortedHand2[i])) return -1;
      }
      return 0;
    case 'pair':
      return comparePair(hand1, hand2);
    case 'two pair':
      return compareTwoPair(hand1, hand2);
    case 'three of a kind':
      return compareThreeOfAKind(hand1, hand2);
    case 'full house':
      return compareFullHouse(hand1, hand2);
    case 'four of a kind':
      return compareFourOfAKind(hand1, hand2);
    default:
      return 0;
  }
}

// Helper functions for comparing specific hand types (to be implemented)
function comparePair(hand1, hand2) {
  const counts1 = getRankCounts(hand1);
  const counts2 = getRankCounts(hand2);

  const pairRank1 = ranks.indexOf(Object.keys(counts1).find(rank => counts1[rank] === 2));
  const pairRank2 = ranks.indexOf(Object.keys(counts2).find(rank => counts2[rank] === 2));

  if (pairRank1 > pairRank2) return 1;
  if (pairRank1 < pairRank2) return -1;

  // If pairs are same, compare kickers
  const kickers1 = sortCards(hand1.filter(card => counts1[card.rank] === 1));
  const kickers2 = sortCards(hand2.filter(card => counts2[card.rank] === 1));

  for (let i = kickers1.length - 1; i >= 0; i--) {
    if (getCardValue(kickers1[i]) > getCardValue(kickers2[i])) return 1;
    if (getCardValue(kickers1[i]) < getCardValue(kickers2[i])) return -1;
  }
  return 0;
}

function compareTwoPair(hand1, hand2) {
  const counts1 = getRankCounts(hand1);
  const counts2 = getRankCounts(hand2);

  const pairs1 = Object.keys(counts1).filter(rank => counts1[rank] === 2).map(rank => ranks.indexOf(rank)).sort((a, b) => a - b);
  const pairs2 = Object.keys(counts2).filter(rank => counts2[rank] === 2).map(rank => ranks.indexOf(rank)).sort((a, b) => a - b);

  // Compare higher pair
  if (pairs1[1] > pairs2[1]) return 1;
  if (pairs1[1] < pairs2[1]) return -1;

  // Compare lower pair
  if (pairs1[0] > pairs2[0]) return 1;
  if (pairs1[0] < pairs2[0]) return -1;

  // Compare kicker
  const kicker1 = sortCards(hand1.filter(card => counts1[card.rank] === 1))[0];
  const kicker2 = sortCards(hand2.filter(card => counts2[card.rank] === 1))[0];

  if (getCardValue(kicker1) > getCardValue(kicker2)) return 1;
  if (getCardValue(kicker1) < getCardValue(kicker2)) return -1;
  
  return 0;
}

function compareThreeOfAKind(hand1, hand2) {
  const counts1 = getRankCounts(hand1);
  const counts2 = getRankCounts(hand2);

  const threeRank1 = ranks.indexOf(Object.keys(counts1).find(rank => counts1[rank] === 3));
  const threeRank2 = ranks.indexOf(Object.keys(counts2).find(rank => counts2[rank] === 3));

  if (threeRank1 > threeRank2) return 1;
  if (threeRank1 < threeRank2) return -1;

  // Compare kickers
  const kickers1 = sortCards(hand1.filter(card => counts1[card.rank] === 1));
  const kickers2 = sortCards(hand2.filter(card => counts2[card.rank] === 1));

  for (let i = kickers1.length - 1; i >= 0; i--) {
    if (getCardValue(kickers1[i]) > getCardValue(kickers2[i])) return 1;
    if (getCardValue(kickers1[i]) < getCardValue(kickers2[i])) return -1;
  }

  return 0;
}

function compareFullHouse(hand1, hand2) {
  const counts1 = getRankCounts(hand1);
  const counts2 = getRankCounts(hand2);

  const threeRank1 = ranks.indexOf(Object.keys(counts1).find(rank => counts1[rank] === 3));
  const threeRank2 = ranks.indexOf(Object.keys(counts2).find(rank => counts2[rank] === 3));

  if (threeRank1 > threeRank2) return 1;
  if (threeRank1 < threeRank2) return -1;

  const pairRank1 = ranks.indexOf(Object.keys(counts1).find(rank => counts1[rank] === 2));
  const pairRank2 = ranks.indexOf(Object.keys(counts2).find(rank => counts2[rank] === 2));

  if (pairRank1 > pairRank2) return 1;
  if (pairRank1 < pairRank2) return -1;

  return 0;
}

function compareFourOfAKind(hand1, hand2) {
  const counts1 = getRankCounts(hand1);
  const counts2 = getRankCounts(hand2);

  const fourRank1 = ranks.indexOf(Object.keys(counts1).find(rank => counts1[rank] === 4));
  const fourRank2 = ranks.indexOf(Object.keys(counts2).find(rank => counts2[rank] === 4));

  if (fourRank1 > fourRank2) return 1;
  if (fourRank1 < fourRank2) return -1;

  // Compare kicker
  const kicker1 = sortCards(hand1.filter(card => counts1[card.rank] === 1))[0];
  const kicker2 = sortCards(hand2.filter(card => counts2[card.rank] === 1))[0];

  if (getCardValue(kicker1) > getCardValue(kicker2)) return 1;
  if (getCardValue(kicker1) < getCardValue(kicker2)) return -1;

  return 0;
}

export { SmartSplit, isFoulForAI as isFoul };
