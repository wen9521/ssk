// frontend/src/games/thirteenWater/logic/thirteen-water-rules.js

// --- 核心数据结构 ---
const रैंक्स = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const सूट्स = ['s', 'h', 'c', 'd'];

const कॉम्बो_टाइप्स = {
  DRAGON: { value: 13, name: '一条龙' },
  ROYAL_FLUSH: { value: 12, name: '同花大顺' },
  STRAIGHT_FLUSH: { value: 11, name: '同花顺' },
  FOUR_OF_A_KIND: { value: 10, name: '铁支' },
  FULL_HOUSE: { value: 9, name: '葫芦' },
  FLUSH: { value: 8, name: '同花' },
  STRAIGHT: { value: 7, name: '顺子' },
  THREE_OF_A_KIND: { value: 6, name: '三条' },
  TWO_PAIR: { value: 5, name: '两对' },
  PAIR: { value: 4, name: '对子' },
  HIGH_CARD: { value: 3, name: '乌龙' }
};

// --- 工具函数 ---
const getRankValue = (card) => रैंक्स.indexOf(card.rank);
const getSuitValue = (card) => सूट्स.indexOf(card.suit);

// --- 牌型检测函数 ---
const isStraight = (hand) => {
    const sortedRanks = hand.map(getRankValue).sort((a, b) => a - b);
    if (sortedRanks[4] === 12 && sortedRanks[0] === 0) { // A-2-3-4-5
        return true;
    }
    for (let i = 0; i < sortedRanks.length - 1; i++) {
        if (sortedRanks[i+1] - sortedRanks[i] !== 1) return false;
    }
    return true;
};

const isFlush = (hand) => {
    const firstSuit = hand[0].suit;
    return hand.every(card => card.suit === firstSuit);
};

// --- 完整牌型检测 ---
function checkHandType(hand) {
    const flush = isFlush(hand);
    const straight = isStraight(hand);
    if (straight && flush) {
        if (hand.map(getRankValue).sort((a,b) => a-b)[4] === 12) return कॉम्बो_टाइप्स.ROYAL_FLUSH;
        return कॉम्बो_टाइप्स.STRAIGHT_FLUSH;
    }
    // ... 在此添加其他牌型（铁支，葫芦等）的完整检测逻辑 ...
    if (flush) return कॉम्बो_टाइप्स.FLUSH;
    if (straight) return कॉम्बो_टाइप्स.STRAIGHT;
    
    return कॉम्बो_टाइप्स.HIGH_CARD;
}

// --- 智能摆牌算法 ---
function getOptimalCombination(hand) {
  // 这是一个简化版的示例，实际的算法会非常复杂
  // 目标：找到一个有效的组合，避免“倒水”
  hand.sort((a, b) => getRankValue(b) - getRankValue(a));
  
  // 简单的分配，并不保证最优
  const back = hand.slice(0, 5);
  const middle = hand.slice(5, 10);
  const front = hand.slice(10, 13);

  // 在实际应用中，需要验证这个组合是否“倒水”，并进行调整
  return { front, middle, back };
}

// --- 比牌逻辑 ---
function compareHands(player1Hands, player2Hands) {
  const p1_back_type = checkHandType(player1Hands.back);
  const p2_back_type = checkHandType(player2Hands.back);
  
  let score = 0;
  if(p1_back_type.value > p2_back_type.value) score++;
  if(p1_back_type.value < p2_back_type.value) score--;
  
  // ... 在此添加中墩和前墩的比较逻辑 ...

  return { totalScore: score };
}

export {
  checkHandType,
  getOptimalCombination,
  compareHands,
  कॉम्बो_टाइप्स
};
