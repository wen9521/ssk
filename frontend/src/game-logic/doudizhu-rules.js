// src/game-logic/doudizhu-rules.js

// --- 基础定义 (不变) ---
const Ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const JokerRanks = { BLACK_JOKER: 'Black Joker', RED_JOKER: 'Red Joker' };

export const valueMap = {
  ...Ranks.reduce((map, rank, i) => ({ ...map, [rank]: i + 3 }), {}),
  [JokerRanks.BLACK_JOKER]: 16,
  [JokerRanks.RED_JOKER]: 17,
};

export const HandType = {
  INVALID: 'INVALID',
  SINGLE: 'SINGLE', // 单张
  PAIR: 'PAIR', // 对子
  TRIO: 'TRIO', // 三不带
  TRIO_WITH_SINGLE: 'TRIO_WITH_SINGLE', // 三带一
  TRIO_WITH_PAIR: 'TRIO_WITH_PAIR', // 三带二
  STRAIGHT: 'STRAIGHT', // 顺子
  DOUBLE_STRAIGHT: 'DOUBLE_STRAIGHT', // 连对
  AIRPLANE: 'AIRPLANE', // 飞机不带翼
  AIRPLANE_WITH_SINGLES: 'AIRPLANE_WITH_SINGLES', // 飞机带单
  AIRPLANE_WITH_PAIRS: 'AIRPLANE_WITH_PAIRS', // 飞机带对
  FOUR_WITH_TWO_SINGLES: 'FOUR_WITH_TWO_SINGLES', // 四带二单
  FOUR_WITH_TWO_PAIRS: 'FOUR_WITH_TWO_PAIRS', // 四带二对
  BOMB: 'BOMB', // 炸弹
  ROCKET: 'ROCKET', // 王炸
};

// --- 辅助函数 ---
function getCardCounts(cards) {
  return cards.reduce((acc, card) => {
    const rank = card.rank;
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {});
}

function getRanksByCount(counts, count) {
  return Object.keys(counts)
    .filter(rank => counts[rank] === count)
    .map(rank => valueMap[rank])
    .sort((a, b) => a - b);
}

function isContinuous(values) {
    if (values.length < 2 || values.some(v => v >= valueMap['2'])) return false;
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i+1] - values[i] !== 1) return false;
    }
    return true;
}

// --- 核心牌型解析函数 ---
export function parseHand(cards) {
  if (!cards || cards.length === 0) return null;

  const len = cards.length;
  const counts = getCardCounts(cards);
  const mainValue = (ranks) => ranks.length > 0 ? Math.min(...ranks) : 0;

  const singles = getRanksByCount(counts, 1);
  const pairs = getRanksByCount(counts, 2);
  const trios = getRanksByCount(counts, 3);
  const fours = getRanksByCount(counts, 4);

  // 王炸
  if (len === 2 && singles.length === 2 && singles.includes(valueMap[JokerRanks.BLACK_JOKER]) && singles.includes(valueMap[JokerRokerRanks.RED_JOKER])) {
    return { type: HandType.ROCKET, value: Infinity, cards };
  }
  // 炸弹
  if (len === 4 && fours.length === 1) {
    return { type: HandType.BOMB, value: mainValue(fours), cards };
  }
  // 单张
  if (len === 1) {
    return { type: HandType.SINGLE, value: mainValue(singles), cards };
  }
  // 对子
  if (len === 2 && pairs.length === 1) {
    return { type: HandType.PAIR, value: mainValue(pairs), cards };
  }
  // 三不带
  if (len === 3 && trios.length === 1) {
    return { type: HandType.TRIO, value: mainValue(trios), cards };
  }
  // 三带一
  if (len === 4 && trios.length === 1 && singles.length === 1) {
    return { type: HandType.TRIO_WITH_SINGLE, value: mainValue(trios), cards };
  }
  // 三带二
  if (len === 5 && trios.length === 1 && pairs.length === 1) {
    return { type: HandType.TRIO_WITH_PAIR, value: mainValue(trios), cards };
  }
  // 四带二单
  if (len === 6 && fours.length === 1 && singles.length === 2) {
    return { type: HandType.FOUR_WITH_TWO_SINGLES, value: mainValue(fours), cards };
  }
  // 四带二对
  if (len === 8 && fours.length === 1 && pairs.length === 2) {
    return { type: HandType.FOUR_WITH_TWO_PAIRS, value: mainValue(fours), cards };
  }
  // 顺子
  if (len >= 5 && singles.length === len && isContinuous(singles)) {
    return { type: HandType.STRAIGHT, value: mainValue(singles), length: len, cards };
  }
  // 连对
  if (len >= 6 && len % 2 === 0 && pairs.length === len / 2 && isContinuous(pairs)) {
    return { type: HandType.DOUBLE_STRAIGHT, value: mainValue(pairs), length: len / 2, cards };
  }
  // 飞机
  if (len >= 6 && len % 3 === 0 && trios.length === len / 3 && isContinuous(trios)) {
      return { type: HandType.AIRPLANE, value: mainValue(trios), length: len/3, cards};
  }
  // 飞机带单
  if (len >= 8 && len % 4 === 0 && trios.length === len / 4 && singles.length === len / 4 && isContinuous(trios)) {
      return { type: HandType.AIRPLANE_WITH_SINGLES, value: mainValue(trios), length: len / 4, cards };
  }
  // 飞机带对
  if (len >= 10 && len % 5 === 0 && trios.length === len / 5 && pairs.length === len / 5 && isContinuous(trios)) {
      return { type: HandType.AIRPLANE_WITH_PAIRS, value: mainValue(trios), length: len / 5, cards };
  }

  return { type: HandType.INVALID, value: 0, cards };
}

/**
 * 判断新出的牌是否能大过当前桌上的牌
 * @param {Object} newHand - 新打出的牌型对象
 * @param {Object} currentHand - 当前桌上的牌型对象
 * @returns {boolean}
 */
export function canPlay(newHand, currentHand) {
  if (!newHand || newHand.type === HandType.INVALID) return false;
  if (!currentHand) return true;

  // 王炸最大
  if (newHand.type === HandType.ROCKET) return true;
  if (currentHand.type === HandType.ROCKET) return false;

  // 新出的是炸弹，当前不是炸弹
  if (newHand.type === HandType.BOMB && currentHand.type !== HandType.BOMB) return true;

  // 都是炸弹，比大小
  if (newHand.type === HandType.BOMB && currentHand.type === HandType.BOMB) {
    return newHand.value > currentHand.value;
  }

  // 牌型和长度必须一致
  if (newHand.type !== currentHand.type || newHand.length !== currentHand.length) {
    return false;
  }
  
  // 比较数值
  return newHand.value > currentHand.value;
}