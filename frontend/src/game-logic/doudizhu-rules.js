// src/game-logic/doudizhu-rules.js

// --- 基础定义 ---
const Ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const JokerRanks = { BLACK_JOKER: 'Black Joker', RED_JOKER: 'Red Joker' };

// 牌值映射，用于比较大小
export const valueMap = {
  ...Ranks.reduce((map, rank, i) => ({ ...map, [rank]: i + 3 }), {}),
  [JokerRanks.BLACK_JOKER]: 16,
  [JokerRanks.RED_JOKER]: 17,
};

// 牌型定义
export const HandType = {
  INVALID: 'INVALID',
  SINGLE: 'SINGLE',
  PAIR: 'PAIR',
  TRIO: 'TRIO',
  TRIO_WITH_SINGLE: 'TRIO_WITH_SINGLE',
  TRIO_WITH_PAIR: 'TRIO_WITH_PAIR',
  STRAIGHT: 'STRAIGHT',
  DOUBLE_STRAIGHT: 'DOUBLE_STRAIGHT', // 连对
  AIRPLANE: 'AIRPLANE', // 飞机不带翼
  AIRPLANE_WITH_SINGLES: 'AIRPLANE_WITH_SINGLES',
  AIRPLANE_WITH_PAIRS: 'AIRPLANE_WITH_PAIRS',
  FOUR_WITH_TWO_SINGLES: 'FOUR_WITH_TWO_SINGLES',
  FOUR_WITH_TWO_PAIRS: 'FOUR_WITH_TWO_PAIRS',
  BOMB: 'BOMB',
  ROCKET: 'ROCKET', // 王炸
};

// --- 核心功能函数 ---

/**
 * 分析一手牌的牌型和数值
 * @param {Array<{rank: string, suit: string}>} cards - 玩家打出的一组牌
 * @returns {{type: string, value: number, cards: Array} | null} - 返回牌型对象或null（如果无效）
 */
export function parseHand(cards) {
  if (!cards || cards.length === 0) return null;

  const counts = cards.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1;
    return acc;
  }, {});

  const values = Object.keys(counts).map(rank => valueMap[rank]).sort((a, b) => a - b);
  const ranksByCount = (count) => Object.keys(counts).filter(rank => counts[rank] === count);

  // --- 牌型判断 (此处仅实现部分作为示例，需要逐步完善) ---
  
  // 王炸 (Rocket)
  if (cards.length === 2 && ranksByCount(1).includes(JokerRanks.BLACK_JOKER) && ranksByCount(1).includes(JokerRanks.RED_JOKER)) {
    return { type: HandType.ROCKET, value: Infinity, cards };
  }
  // 炸弹 (Bomb)
  if (cards.length === 4 && ranksByCount(4).length === 1) {
    return { type: HandType.BOMB, value: values[0], cards };
  }
  // 单张
  if (cards.length === 1) {
    return { type: HandType.SINGLE, value: values[0], cards };
  }
  // 对子
  if (cards.length === 2 && ranksByCount(2).length === 1) {
    return { type: HandType.PAIR, value: values[0], cards };
  }
  // 三条
  if (cards.length === 3 && ranksByCount(3).length === 1) {
    return { type: HandType.TRIO, value: values[0], cards };
  }
  // 顺子 (至少5张, 不能带2和大小王)
  if (cards.length >= 5 && ranksByCount(1).length === cards.length && values[values.length - 1] < valueMap['2'] && values[values.length - 1] - values[0] === cards.length - 1) {
      return { type: HandType.STRAIGHT, value: values[0], length: cards.length, cards };
  }
  
  // ... 此处需要继续添加所有其他牌型的判断逻辑 ...
  // 三带一, 三带二, 连对, 飞机等等

  return null; // 无法识别的牌型
}


/**
 * 判断新出的牌是否能大过当前桌上的牌
 * @param {Object} newHand - 新打出的牌型对象 (来自parseHand)
 * @param {Object} currentHand - 当前桌上的牌型对象 (上一家打的)
 * @returns {boolean}
 */
export function canPlay(newHand, currentHand) {
  if (!newHand) return false;

  // 如果当前没人出牌，任何有效牌型都可以出
  if (!currentHand) return true;

  // 王炸最大
  if (newHand.type === HandType.ROCKET) return true;
  if (currentHand.type === HandType.ROCKET) return false;

  // 炸弹可以大过除王炸外的任何牌型
  if (newHand.type === HandType.BOMB && currentHand.type !== HandType.BOMB) return true;

  // 牌型必须一致
  if (newHand.type !== currentHand.type) return false;
  
  // 顺子、连对等需要比较长度
  if (newHand.length !== currentHand.length) return false;
  
  // 比较数值
  return newHand.value > currentHand.value;
}