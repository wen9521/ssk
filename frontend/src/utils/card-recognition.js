// frontend/src/utils/card-recognition.js

/**
 * 根据SVG文件名识别扑克牌的中文名称
 * @param {string} filename - SVG图片的文件名 (例如 "king_of_diamonds.svg")
 * @returns {string} - 扑克牌的中文名称 (例如 "方块K")
 */
export function getCardNameFromFilename(filename) {
  if (!filename) {
    return '未知牌';
  }

  // 移除文件扩展名
  const name = filename.replace('.svg', '');

  // 处理大小王
  if (name === 'red_joker') {
    return '大王';
  }
  if (name === 'black_joker') {
    return '小王';
  }

  // 分割文件名以获取花色和点数
  const parts = name.split('_of_');
  if (parts.length !== 2) {
    return '格式错误';
  }

  const [rankStr, suitStr] = parts;

  // 定义花色和点数的映射
  const suitMap = {
    'spades': '黑桃',
    'hearts': '红桃',
    'clubs': '梅花',
    'diamonds': '方块'
  };

  const rankMap = {
    'ace': 'A',
    'king': 'K',
    'queen': 'Q',
    'jack': 'J',
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

  const suit = suitMap[suitStr];
  const rank = rankMap[rankStr];

  if (!suit || !rank) {
    return '未知牌';
  }

  // 组合成最终的中文名称
  return `${suit}${rank}`;
}
