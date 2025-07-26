// frontend/src/games/doudizhu/logic/doudizhu.rules.js

// --- 核心数据结构 ---
const रैंक्स = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2', 'B', 'R']; // B: Black Joker, R: Red Joker
const रैंक_मूल्य = Object.fromEntries(रैंक्स.map((rank, i) => [rank, i]));

const हैंड_टाइप = {
  INVALID: '无效牌型',
  SINGLE: '单张',
  PAIR: '对子',
  TRIO: '三条',
  TRIO_WITH_SINGLE: '三带一',
  TRIO_WITH_PAIR: '三带二',
  STRAIGHT: '顺子',
  SEQUENCE_OF_PAIRS: '连对',
  SEQUENCE_OF_TRIOS: '飞机不带翼',
  SEQUENCE_OF_TRIOS_WITH_SINGLES: '飞机带单翼',
  SEQUENCE_OF_TRIOS_WITH_PAIRS: '飞机带双翼',
  BOMB: '炸弹',
  ROCKET: '王炸',
};

// --- 牌型解析与比较 ---

/**
 * 解析一手牌的牌型
 * @param {Array} cards - 卡牌数组
 * @returns {Object} - { type, value, length }
 */
function parseHand(cards) {
  // ... 包含对所有牌型（飞机、连对等）的完整、精确的解析逻辑
  // 这会是一个相对复杂的函数，需要分析牌的数量、构成等
  // 为保持简洁，此处仅作示意
  if (cards.length === 1) return { type: हैंड_टाइप.SINGLE, value: रैंक_मूल्य[cards[0].rank], length: 1 };
  if (cards.length === 2 && cards[0].rank === 'B' && cards[1].rank === 'R') return { type: हैंड_टाइप.ROCKET, value: Infinity, length: 2 };
  // ... 更多牌型
  return { type: हैंड_टाइप.INVALID, value: 0, length: 0 };
}

/**
 * 判断 newPlay 是否能大过 lastPlay
 * @param {Object} newPlay - 新打出的牌
 * @param {Object} lastPlay - 上一家的牌
 * @returns {Boolean}
 */
function canPlay(newPlay, lastPlay) {
  if (newPlay.type === हैंड_टाइप.INVALID) return false;
  if (!lastPlay) return true; // 如果是第一个出牌，任何有效牌型都可以

  if (newPlay.type === हैंड_टाइप.ROCKET) return true; // 王炸最大

  if (lastPlay.type === हैंड_टाइप.ROCKET) return false; // 对面王炸，你出不了

  if (newPlay.type === हैंड_टाइप.BOMB && lastPlay.type !== हैंड_टाइप.BOMB) return true; // 炸弹可以炸所有非炸弹牌型

  if (newPlay.type === lastPlay.type && newPlay.length === lastPlay.length && newPlay.value > lastPlay.value) {
    return true; // 牌型和长度都相同，比较大小
  }

  return false;
}

// --- AI 逻辑 ---

/**
 * AI 根据当前手牌和场上局势决定出什么牌
 * @param {Array} aiHand - AI 的手牌
 * @param {Object} lastPlay - 上一家的牌
 * @returns {Array|null} - 返回要出的牌，或者 null 表示不出
 */
function getAIPlay(aiHand, lastPlay) {
  // AI 逻辑会：
  // 1. 尝试用最小的牌大过 lastPlay
  // 2. 如果是自己出牌，则优先出最不容易被接上的牌（比如单张3）
  // 3. 在关键时刻，决定是否要出炸弹
  // ...
  return null; // 简化示例：AI选择不出
}


export {
  parseHand,
  canPlay,
  getAIPlay,
  हैंड_टाइप
};
