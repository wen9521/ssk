// frontend/src/utils/card-utils.js

/**
 * 将游戏逻辑中的卡牌对象转换为SVG图片文件名。
 * @param {{rank: string, suit: string}} card - 卡牌对象, e.g., { rank: 'K', suit: 'diamonds' }
 * @returns {string} - 对应的SVG文件名, e.g., "king_of_diamonds.svg"
 */
export function cardToImageName(card) {
  if (!card || !card.rank || !card.suit) {
    // 提供一个占位符或错误图像
    console.warn("Invalid card object provided:", card);
    return 'back.svg'; // 假设你有一个名为 back.svg 的牌背图片
  }

  const rankMap = {
    'A': 'ace',
    'K': 'king',
    'Q': 'queen',
    'J': 'jack',
    'T': '10', // 假设您的逻辑中使用 'T' 代表 10
    '10': '10',
    '9': '9',
    '8': '8',
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2'
  };

  // suit 已经是 'spades', 'hearts', 'clubs', 'diamonds'，无需转换

  const rankStr = rankMap[card.rank];

  if (!rankStr || !card.suit) {
    console.warn("Cannot map card to image:", card);
    return 'back.svg';
  }

  return `${rankStr.toLowerCase()}_of_${card.suit}.svg`;
}

/**
 * 将卡牌对象转换为可读的中文名称。
 * @param {{rank: string, suit: string}} card - 卡牌对象
 * @returns {string} - 中文名, e.g., "方块K"
 */
export function cardToDisplayName({ rank, suit }) {
  const suitMap = {
    spades: '黑桃',
    hearts: '红桃',
    clubs: '梅花',
    diamonds: '方块'
  };

  const rankName = rank === 'T' ? '10' : rank;

  return `${suitMap[suit] || ''}${rankName || ''}`;
}

// 示例：处理大小王（如果您的游戏逻辑包含它们）
// 您的十三水逻辑目前不包含大小王，但如果未来需要，可以这样处理：
// if (card.rank === 'red_joker') return 'red_joker.svg';
// if (card.rank === 'black_joker') return 'black_joker.svg';
