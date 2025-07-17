// frontend/src/CardUtils.js

const RANK_MAP = {
  'A': 'ace',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'jack',
  'Q': 'queen',
  'K': 'king',
};

const SUIT_MAP = {
  'S': 'spades',
  'H': 'hearts',
  'D': 'diamonds',
  'C': 'clubs',
};

/**
 * 将扑克牌代码转换为图片文件名（不含扩展名）。
 * @param {string} cardCode - 扑克牌的代码，例如 'AS', '10C', 'KH'。
 * @returns {string} - 图片文件名，例如 'ace_of_spades', '10_of_clubs', 'king_of_hearts'。
 */
export const getCardImageName = (cardCode) => {
  if (!cardCode || cardCode.length < 2) {
    return 'placeholder'; // 返回一个占位符，防止代码崩溃
  }

  const rank = cardCode.slice(0, -1);
  const suit = cardCode.slice(-1);

  const rankName = RANK_MAP[rank];
  const suitName = SUIT_MAP[suit];

  if (!rankName || !suitName) {
    console.warn(`无法识别的扑克牌代码: ${cardCode}`);
    return 'placeholder';
  }

  return `${rankName}_of_${suitName}`;
};
