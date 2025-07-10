const VALUE_ORDER = {
 '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
 '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};
const SUIT_ORDER = { '♠': 4, '♥': 3, '♣': 2, '♦': 1 };

const HAND_TYPE_RANK = {
  '高牌': 1,
  '对子': 2,
  '两对': 3,
  '三条': 4,
  '顺子': 5,
  '同花': 6,
  '葫芦': 7,
  '铁支': 8,
  '同花顺': 9,
  '皇家同花顺': 10
};

// 修复：添加缺失的areaTypeRank函数
function areaTypeRank(type, area) {
  if (area === 'head') {
    if (type === '三条') return 3;
    if (type === '对子') return 2;
    return 1;
  }
  return HAND_TYPE_RANK[type] || 1;
}

function cardValue(card) {
  const rank = card.slice(0, -1);
  return VALUE_ORDER[rank] || 0;
}

function cardSuit(card) {
  return card.slice(-1);
}

function getGroupedValues(cards) {
  const groups = {};
  cards.forEach(card => {
    const value = cardValue(card);
    groups[value] = (groups[value] || 0) + 1;
  });
  return groups;
}

function isFlush(cards) {
  if (!cards.length) return false;
  const firstSuit = cardSuit(cards[0]);
  return cards.every(card => cardSuit(card) === firstSuit);
}

function isStraight(cards) {
  const values = cards.map(cardValue).sort((a, b) => a - b);
  
  // 检查普通顺子
  let isNormalStraight = true;
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i-1] !== 1) {
      isNormalStraight = false;
      break;
    }
  }
  
  // 检查A-2-3-4-5特殊顺子
  const isSpecialStraight = 
    values.includes(14) && 
    values.includes(2) && 
    values.includes(3) && 
    values.includes(4) && 
    values.includes(5);
  
  return isNormalStraight || isSpecialStraight;
}

export function isFoul(head, middle, tail) {
  const headType = getAreaType(head, 'head');
  const middleType = getAreaType(middle, 'middle');
  const tailType = getAreaType(tail, 'tail');
  
  const headRank = areaTypeRank(headType, 'head');
  const midRank = areaTypeRank(middleType, 'middle');
  const tailRank = areaTypeRank(tailType, 'tail');
  
  if (headRank > midRank || midRank > tailRank) return true;
  
  if (headRank === midRank) {
    if (compareArea(head, middle, 'head') > 0) return true;
  }
  
  if (midRank === tailRank) {
    if (compareArea(middle, tail, 'middle') > 0) return true;
  }
  
  return false;
}

function getAreaType(cards, area) {
  if (!cards || cards.length === 0) return '高牌';
  
  const grouped = getGroupedValues(cards);
  const counts = Object.values(grouped);
  
  if (cards.length === 3) {
    if (counts.includes(3)) return '三条';
    if (counts.includes(2)) return '对子';
    return '高牌';
  }
  
  const flush = isFlush(cards);
  const straight = isStraight(cards);
  
  if (flush && straight) {
    return cards.some(c => cardValue(c) === 14) ? '皇家同花顺' : '同花顺';
  }
  if (counts.includes(4)) return '铁支';
  if (counts.includes(3) && counts.includes(2)) return '葫芦';
  if (flush) return '同花';
  if (straight) return '顺子';
  if (counts.includes(3)) return '三条';
  if (counts.filter(c => c === 2).length === 2) return '两对';
  if (counts.includes(2)) return '对子';
  
  return '高牌';
}

function compareArea(a, b, area) {
  const typeA = getAreaType(a, area);
  const typeB = getAreaType(b, area);
  
  const rankA = areaTypeRank(typeA, area);
  const rankB = areaTypeRank(typeB, area);
  
  if (rankA !== rankB) {
    return rankA > rankB ? 1 : -1;
  }
  
  // 同类型比较牌值
  const valuesA = a.map(cardValue).sort((x, y) => y - x);
  const valuesB = b.map(cardValue).sort((x, y) => y - x);
  
  for (let i = 0; i < Math.min(valuesA.length, valuesB.length); i++) {
    if (valuesA[i] !== valuesB[i]) {
      return valuesA[i] > valuesB[i] ? 1 : -1;
    }
  }
  
  return 0;
}

export function calcSSSAllScores(players) {
  const scores = new Array(players.length).fill(0);
  
  for (let i = 0; i < players.length; i++) {
    const p1 = players[i];
    const foul1 = isFoul(p1.head, p1.middle, p1.tail);
    
    for (let j = i + 1; j < players.length; j++) {
      const p2 = players[j];
      const foul2 = isFoul(p2.head, p2.middle, p2.tail);
      
      if (foul1 && !foul2) {
        scores[i] -= 3;
        scores[j] += 3;
      } else if (!foul1 && foul2) {
        scores[i] += 3;
        scores[j] -= 3;
      } else if (!foul1 && !foul2) {
        // 比较三道
        const headCmp = compareArea(p1.head, p2.head, 'head');
        if (headCmp > 0) scores[i] += 1;
        else if (headCmp < 0) scores[j] += 1;
        
        const middleCmp = compareArea(p1.middle, p2.middle, 'middle');
        if (middleCmp > 0) scores[i] += 1;
        else if (middleCmp < 0) scores[j] += 1;
        
        const tailCmp = compareArea(p1.tail, p2.tail, 'tail');
        if (tailCmp > 0) scores[i] += 1;
        else if (tailCmp < 0) scores[j] += 1;
      }
    }
  }
  
  return scores;
}