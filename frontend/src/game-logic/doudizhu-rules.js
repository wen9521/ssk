// src/game-logic/doudizhu-rules.js
const Ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const JokerRanks = { BLACK_JOKER: 'Black Joker', RED_JOKER: 'Red Joker' };

export const valueMap = {
  ...Ranks.reduce((map, rank, i) => ({ ...map, [rank]: i + 3 }), {}),
  [JokerRanks.BLACK_JOKER]: 16,
  [JokerRanks.RED_JOKER]: 17,
};

export const HandType = {
  INVALID: 'INVALID', SINGLE: 'SINGLE', PAIR: 'PAIR', TRIO: 'TRIO',
  TRIO_WITH_SINGLE: 'TRIO_WITH_SINGLE', TRIO_WITH_PAIR: 'TRIO_WITH_PAIR',
  STRAIGHT: 'STRAIGHT', DOUBLE_STRAIGHT: 'DOUBLE_STRAIGHT', AIRPLANE: 'AIRPLANE',
  AIRPLANE_WITH_SINGLES: 'AIRPLANE_WITH_SINGLES', AIRPLANE_WITH_PAIRS: 'AIRPLANE_WITH_PAIRS',
  FOUR_WITH_TWO_SINGLES: 'FOUR_WITH_TWO_SINGLES', FOUR_WITH_TWO_PAIRS: 'FOUR_WITH_TWO_PAIRS',
  BOMB: 'BOMB', ROCKET: 'ROCKET',
};

function getCardCounts(cards) {
  return cards.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1;
    return acc;
  }, {});
}
function getRanksByCount(counts, count) {
  return Object.keys(counts).filter(rank => counts[rank] === count).map(rank => valueMap[rank]).sort((a, b) => a - b);
}
function isContinuous(values) {
    if (values.length < 2 || values.some(v => v >= valueMap['2'])) return false;
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i+1] - values[i] !== 1) return false;
    }
    return true;
}

export function parseHand(cards) {
  if (!cards || cards.length === 0) return null;
  const len = cards.length;
  const counts = getCardCounts(cards);
  const mainValue = (ranks) => ranks.length > 0 ? Math.min(...ranks) : 0;
  const singles = getRanksByCount(counts, 1);
  const pairs = getRanksByCount(counts, 2);
  const trios = getRanksByCount(counts, 3);
  const fours = getRanksByCount(counts, 4);

  if (len === 2 && singles.length === 2 && singles.includes(valueMap[JokerRanks.BLACK_JOKER]) && singles.includes(valueMap[JokerRanks.RED_JOKER]))
    return { type: HandType.ROCKET, value: Infinity, cards };
  if (len === 4 && fours.length === 1)
    return { type: HandType.BOMB, value: mainValue(fours), cards };
  if (len === 1)
    return { type: HandType.SINGLE, value: mainValue(singles), cards };
  if (len === 2 && pairs.length === 1)
    return { type: HandType.PAIR, value: mainValue(pairs), cards };
  if (len === 3 && trios.length === 1)
    return { type: HandType.TRIO, value: mainValue(trios), cards };
  if (len === 4 && trios.length === 1 && singles.length === 1)
    return { type: HandType.TRIO_WITH_SINGLE, value: mainValue(trios), cards };
  if (len === 5 && trios.length === 1 && pairs.length === 1)
    return { type: HandType.TRIO_WITH_PAIR, value: mainValue(trios), cards };
  if (len === 6 && fours.length === 1 && singles.length === 2)
    return { type: HandType.FOUR_WITH_TWO_SINGLES, value: mainValue(fours), cards };
  if (len === 8 && fours.length === 1 && pairs.length === 2)
    return { type: HandType.FOUR_WITH_TWO_PAIRS, value: mainValue(fours), cards };
  if (len >= 5 && singles.length === len && isContinuous(singles))
    return { type: HandType.STRAIGHT, value: mainValue(singles), length: len, cards };
  if (len >= 6 && len % 2 === 0 && pairs.length === len / 2 && isContinuous(pairs))
    return { type: HandType.DOUBLE_STRAIGHT, value: mainValue(pairs), length: len / 2, cards };
  if (len >= 6 && len % 3 === 0 && trios.length === len / 3 && isContinuous(trios))
    return { type: HandType.AIRPLANE, value: mainValue(trios), length: len/3, cards};
  if (len >= 8 && len % 4 === 0 && trios.length === len / 4 && singles.length === len / 4 && isContinuous(trios))
    return { type: HandType.AIRPLANE_WITH_SINGLES, value: mainValue(trios), length: len / 4, cards };
  if (len >= 10 && len % 5 === 0 && trios.length === len / 5 && pairs.length === len / 5 && isContinuous(trios))
    return { type: HandType.AIRPLANE_WITH_PAIRS, value: mainValue(trios), length: len / 5, cards };

  return { type: HandType.INVALID, value: 0, cards };
}
export function canPlay(newHand, currentHand) {
  if (!newHand || newHand.type === HandType.INVALID) return false;
  if (!currentHand) return true;
  if (newHand.type === HandType.ROCKET) return true;
  if (currentHand.type === HandType.ROCKET) return false;
  if (newHand.type === HandType.BOMB && currentHand.type !== HandType.BOMB) return true;
  if (newHand.type === HandType.BOMB && currentHand.type === HandType.BOMB) {
    return newHand.value > currentHand.value;
  }
  if (newHand.type !== currentHand.type || newHand.length !== currentHand.length) {
    return false;
  }
  return newHand.value > currentHand.value;
}