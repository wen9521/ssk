// src/utils/card-utils.js
// (如果文件已存在，请用此代码覆盖)

/**
 * 将游戏逻辑中的卡牌对象转换为SVG图片文件名。
 * @param {{rank: string, suit: string}} card - 卡牌对象, e.g., { rank: 'K', suit: 'diamonds' }
 * @returns {string} - 对应的SVG文件名, e.g., "king_of_diamonds.svg"
 */
export function cardToImageName(card) {
  if (!card || !card.rank || !card.suit) {
    console.warn("Invalid card object provided:", card);
    // 假设你有一个名为 back.svg 的牌背图片用于占位或错误状态
    return 'back.svg'; 
  }

  const rankMap = {
    'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10',
    '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2'
  };

  const rankStr = rankMap[card.rank];

  if (!rankStr) {
    console.warn("Cannot map card rank to image name:", card);
    return 'back.svg';
  }

  return `${rankStr.toLowerCase()}_of_${card.suit}.svg`;
}

/**
 * 将卡牌对象转换为可读的中文名称 (用于 alt 属性)。
 * @param {{rank: string, suit: string}} card - 卡牌对象
 * @returns {string} - 中文名, e.g., "方块K"
 */
export function cardToDisplayName({ rank, suit }) {
  const suitMap = {
    spades: '黑桃', hearts: '红桃', clubs: '梅花', diamonds: '方块'
  };
  const rankName = rank === 'T' ? '10' : rank;
  return `${suitMap[suit] || ''}${rankName || ''}`;
}
