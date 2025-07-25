// src/utils/card-utils.js
export function cardToImageName(card) {
  if (!card || !card.rank || !card.suit) {
    return 'back.svg';
  }

  // --- 关键修复：优先处理大小鬼 ---
  if (card.rank === 'Red Joker') {
    return 'red_joker.svg';
  }
  if (card.rank === 'Black Joker') {
    return 'black_joker.svg';
  }
  // --------------------------------

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

export function cardToDisplayName({ rank, suit }) {
  // --- 关键修复：处理大小鬼中文名 ---
  if (rank === 'Red Joker') return '大鬼';
  if (rank === 'Black Joker') return '小鬼';
  // ----------------------------------

  const suitMap = {
    spades: '黑桃', hearts: '红桃', clubs: '梅花', diamonds: '方块'
  };
  const rankName = rank === 'T' ? '10' : rank;
  return `${suitMap[suit] || ''}${rankName || ''}`;
}