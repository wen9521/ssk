// frontend/src/utils/game/cardImage.js

// 牌面英文映射
const rankMap = {
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
  'K': 'king'
};

const suitMap = {
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
  'S': 'spades',
  'H': 'hearts',
  'D': 'diamonds',
  'C': 'clubs'
};

export function getCardImageUrl(card) {
  // ✅【新增的健壮性检查】
  // 如果 card 是 undefined, null, 或者不是一个有效的字符串, 就返回一个默认的牌背图片
  if (!card || typeof card !== 'string' || card.length < 2) {
    return '/cards/red_joker.svg'; // 返回默认牌背或Joker图片
  }

  // 支持 "A♠"、"10♣"、"AS" 等格式
  let rank = card.slice(0, card.length - 1).toUpperCase();
  let suit = card.slice(-1).toUpperCase();

  // 特殊处理 10
  if (rank === '1' && suit === '0') {
    rank = '10';
    suit = card.slice(-1).toUpperCase();
  }

  const fileName = `${rankMap[rank]}_of_${suitMap[suit]}.svg`;
  
  // ✅ 额外检查以防映射失败
  if (!rankMap[rank] || !suitMap[suit]) {
    return '/cards/red_joker.svg';
  }

  // Cloudflare Pages 图片目录
  return `/cards/${fileName}`;
}
