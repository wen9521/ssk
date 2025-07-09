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
  // 支持 "A♠"、"10♣"、"AS" 等格式
  let rank = card.slice(0, card.length - 1).toUpperCase();
  let suit = card.slice(-1).toUpperCase();

  // 特殊处理 10
  if (rank === '1' && suit === '0') {
    rank = '10';
    suit = card.slice(-1).toUpperCase();
  }

  let fileName = `${rankMap[rank]}_of_${suitMap[suit]}.svg`;
  // Cloudflare Pages 图片目录
  return `/cards/${fileName}`;
}
