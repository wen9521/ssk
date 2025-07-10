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
  'S': 'spades',
  'H': 'hearts',
  'D': 'diamonds',
  'C': 'clubs',
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs'
};

export function getCardImageUrl(card) {
  // 处理空值
  if (!card || typeof card !== 'string') {
    return '/cards/red_joker.svg';
  }
  
  // 处理 "10_of_spades" 格式
  if (card.includes('_of_')) {
    return `/cards/${card}.svg`;
  }
  
  // 处理 "10H", "AS" 等格式
  let rank, suit;
  
  // 处理10开头的牌
  if (card.startsWith('10') && card.length >= 3) {
    rank = '10';
    suit = card.slice(2);
  } else {
    rank = card.slice(0, -1);
    suit = card.slice(-1);
  }
  
  // 映射到文件名
  const rankName = rankMap[rank] || '2';
  const suitName = suitMap[suit] || 'clubs';
  
  return `/cards/${rankName}_of_${suitName}.svg`;
}