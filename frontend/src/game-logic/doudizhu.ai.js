// src/game-logic/doudizhu.ai.js
import { parseHand, canPlay, valueMap, JokerRanks } from './doudizhu.rules.js';

export function decideBid(hand, currentBid) {
  const bigCards = hand.filter(c => valueMap[c.rank] >= valueMap['2']).length;
  const hasRocket = hand.some(c => c.rank === JokerRanks.RED_JOKER) && hand.some(c => c.rank === JokerRanks.BLACK_JOKER);
  if (hasRocket && bigCards >= 2 && currentBid < 3) return 3;
  if (bigCards >= 4 && currentBid < 3) return 3;
  if (bigCards >= 3 && currentBid < 2) return 2;
  if (bigCards >= 2 && currentBid < 1) return 1;
  return 0;
}

export function decidePlay(hand, currentHandOnTable) {
  const possiblePlays = findPossibleHands(hand);
  const validPlays = possiblePlays.filter(play => canPlay(play.parsed, currentHandOnTable));
  if (validPlays.length === 0) return null;
  validPlays.sort((a, b) => {
    const aIsBomb = a.parsed.type === 'BOMB';
    const bIsBomb = b.parsed.type === 'BOMB';
    if (aIsBomb && !bIsBomb) return 1;
    if (!aIsBomb && bIsBomb) return -1;
    return a.parsed.value - b.parsed.value;
  });
  return validPlays[0].cards;
}

function findPossibleHands(hand) {
    const hands = [];
    const counts = hand.reduce((acc, card) => {
        acc[card.rank] = (acc[card.rank] || 0) + 1;
        return acc;
    }, {});

    for (const rank in counts) {
        const cardsOfRank = hand.filter(c => c.rank === rank);
        if (counts[rank] >= 1) {
            const parsed = parseHand([cardsOfRank[0]]);
            if (parsed) hands.push({ cards: [cardsOfRank[0]], parsed });
        }
        if (counts[rank] >= 2) {
            const parsed = parseHand(cardsOfRank.slice(0, 2));
            if (parsed) hands.push({ cards: cardsOfRank.slice(0, 2), parsed });
        }
        if (counts[rank] >= 3) {
            const parsed = parseHand(cardsOfRank.slice(0, 3));
            if (parsed) hands.push({ cards: cardsOfRank.slice(0, 3), parsed });
        }
        if (counts[rank] === 4) {
            const parsed = parseHand(cardsOfRank);
            if (parsed) hands.push({ cards: cardsOfRank, parsed });
        }
    }
    return hands.filter(h => h.parsed && h.parsed.type !== 'INVALID');
}