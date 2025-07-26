const VALUE_ORDER = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
};

const SCORES = {
  HEAD: { '三条': 3 },
  MIDDLE: { '铁支': 8, '同花顺': 10, '葫芦': 2 },
  TAIL: { '铁支': 4, '同花顺': 5 },
  SPECIAL: { '一条龙': 13, '三同花': 4, '三顺子': 4, '六对半': 3 },
};

// --- 工具函数 ---
const cardValue = (card) => VALUE_ORDER[card.split('_')[0]];
const uniq = (arr) => [...new Set(arr)];
const groupBy = (arr, fn) => {
  const g = {};
  arr.forEach(x => { const k = fn(x); g[k] = g[k] || []; g[k].push(x); });
  return g;
};

// --- 牌型判断函数 ---

// 【修复】优化顺子判断逻辑
function isStraight(cards) {
    if (!cards || cards.length < 3) return false;
    const vals = uniq(cards.map(cardValue)).sort((a, b) => a - b);
    if (vals.length !== cards.length) return false;
  
    // 检查 A-5 顺子 (10-J-Q-K-A 在下面会被正常逻辑覆盖)
    // 将 A(14) 替换为 1 来判断
    const isAceLow = vals.includes(14) && vals.includes(2);
    if (isAceLow) {
        const tempVals = vals.map(v => v === 14 ? 1 : v).sort((a,b) => a - b);
        // 检查转换后的值是否连续
        for (let i = 0; i < tempVals.length - 1; i++) {
          if (tempVals[i+1] !== tempVals[i] + 1) return false;
        }
        return true;
    }
  
    // 检查普通顺子
    for (let i = 0; i < vals.length - 1; i++) {
        if (vals[i+1] !== vals[i] + 1) return false;
    }
    
    return true;
}

function isFlush(cards) {
  if (!cards || cards.length === 0) return false;
  return uniq(cards.map(c => c.split('_')[2])).length === 1;
}

function getHandType(cards, area) {
  if (!cards || cards.length < 3) return "高牌";
  const vals = cards.map(cardValue), suits = cards.map(c => c.split('_')[2]),
    uniqVals = uniq(vals), uniqSuits = uniq(suits);

  const isS = isStraight(cards);
  const isF = isFlush(cards);
  const grouped = groupBy(vals);
  const counts = Object.values(grouped).map(g => g.length);

  if (cards.length === 5) {
    if (isS && isF) return "同花顺";
    if (counts.includes(4)) return "铁支";
    if (counts.includes(3) && counts.includes(2)) return "葫芦";
    if (isF) return "同花";
    if (isS) return "顺子";
    if (counts.includes(3)) return "三条";
    if (counts.filter(c => c === 2).length === 2) return "两对";
    if (counts.includes(2)) return "对子";
    return "高牌";
  }
  if (cards.length === 3) {
    if (uniqVals.length === 1) return "三条";
    if (uniqVals.length === 2) return "对子";
    return "高牌";
  }
  return "高牌";
}

function getHandRank(cards, area) {
  const type = getHandType(cards, area);
  const rankMap = { "同花顺": 9, "铁支": 8, "葫芦": 7, "同花": 6, "顺子": 5, "三条": 4, "两对": 3, "对子": 2, "高牌": 1 };
  
  if (area === 'head') {
    // 头道的三条比对子大，但牌型等级上，三条(4) > 对子(2) > 高牌(1)
    if (type === "三条") return 4;
    if (type === "对子") return 2;
    return 1;
  }
  
  return rankMap[type] || 1;
}

// --- 核心比牌函数 ---
function compareArea(a, b, area) {
    const rankA = getHandRank(a, area), rankB = getHandRank(b, area);
    if (rankA !== rankB) return rankA - rankB;

    // 牌型相同时，比较牌值
    const getSortedGroup = (cards) => Object.entries(groupBy(cards, cardValue))
        .map(([val, group]) => ({ val: Number(val), count: group.length, cards: group }))
        .sort((x, y) => y.count - x.count || y.val - x.val);

    const groupA = getSortedGroup(a);
    const groupB = getSortedGroup(b);

    for (let i = 0; i < groupA.length; i++) {
        if (groupA[i].val !== groupB[i].val) return groupA[i].val - groupB[i].val;
    }
    return 0; // 完全相同
}

// --- 倒水判断 ---
export function isFoul(head, middle, tail) {
  if (!head || !middle || !tail || head.length !== 3 || middle.length !== 5 || tail.length !== 5) return true; // 牌数不对也是倒水
  const headRank = getHandRank(head, 'head');
  const midRank = getHandRank(middle, 'middle');
  const tailRank = getHandRank(tail, 'tail');
  
  if (headRank > midRank || midRank > tailRank) return true;
  if (headRank === midRank && compareArea(head, middle, 'head') > 0) return true;
  if (midRank === tailRank && compareArea(middle, tail, 'middle') > 0) return true;
  return false;
}

// --- 计分逻辑 ---
function getSpecialType(p) {
  const allCards = [...p.head, ...p.middle, ...p.tail];
  if (allCards.length !== 13) return null;
  
  if (uniq(allCards.map(cardValue)).length === 13) return '一条龙';
  if (Object.values(groupBy(allCards, cardValue)).filter(g => g.length === 2).length === 6) return '六对半';
  if (isFlush(p.head) && isFlush(p.middle) && isFlush(p.tail)) return '三同花';
  // 特殊三顺子判断需要更严谨，这里简化为依赖 getHandType
  const headType = getHandType(p.head, 'head');
  const midType = getHandType(p.middle, 'middle');
  const tailType = getHandType(p.tail, 'tail');
  if (headType === '顺子' && midType === '顺子' && tailType === '顺子') return '三顺子';
  
  return null;
}

function getAreaBaseScore(cards, area) {
  const type = getHandType(cards, area);
  if (area === 'head' && type === '三条') return SCORES.HEAD['三条'];
  if (area === 'middle') {
      if (type === '葫芦') return SCORES.MIDDLE['葫芦'];
      if (type === '铁支') return SCORES.MIDDLE['铁支'];
      if (type === '同花顺') return SCORES.MIDDLE['同花顺'];
  }
  if (area === 'tail') {
      if (type === '铁支') return SCORES.TAIL['铁支'];
      if (type === '同花顺') return SCORES.TAIL['同花顺'];
  }
  return 1; // 基础分
}

export function calcSSSAllScores(playersData) {
  const N = playersData.length;
  if (N < 2) return playersData.map(() => ({ totalScore: 0, details: {} }));

  const playerInfos = playersData.map(p => ({
    ...p,
    specialType: p.isFoul ? null : getSpecialType(p),
  }));

  const playerScores = Array(N).fill(0);

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const p1 = playerInfos[i];
      const p2 = playerInfos[j];
      let roundScore = 0;

      if (p1.isFoul && !p2.isFoul) {
        roundScore = -3 - (SCORES.SPECIAL[p2.specialType] || 0);
      } else if (!p1.isFoul && p2.isFoul) {
        roundScore = 3 + (SCORES.SPECIAL[p1.specialType] || 0);
      } else if (p1.isFoul && p2.isFoul) {
        roundScore = 0;
      } else if (p1.specialType || p2.specialType) {
        const score1 = SCORES.SPECIAL[p1.specialType] || 0;
        const score2 = SCORES.SPECIAL[p2.specialType] || 0;
        roundScore = score1 - score2;
      } else {
        let p1WinCount = 0;
        if(compareArea(p1.head, p2.head, 'head') > 0) p1WinCount++;
        if(compareArea(p1.middle, p2.middle, 'middle') > 0) p1WinCount++;
        if(compareArea(p1.tail, p2.tail, 'tail') > 0) p1WinCount++;
        
        const headScore = (compareArea(p1.head, p2.head, 'head') > 0) ? getAreaBaseScore(p1.head, 'head') : -getAreaBaseScore(p2.head, 'head');
        const middleScore = (compareArea(p1.middle, p2.middle, 'middle') > 0) ? getAreaBaseScore(p1.middle, 'middle') : -getAreaBaseScore(p2.middle, 'middle');
        const tailScore = (compareArea(p1.tail, p2.tail, 'tail') > 0) ? getAreaBaseScore(p1.tail, 'tail') : -getAreaBaseScore(p2.tail, 'tail');
        roundScore = headScore + middleScore + tailScore;
        
        // 打枪（全垒打）判断
        if (p1WinCount === 3) roundScore *= 2;
        if (p1WinCount === 0) roundScore *= 2;
      }
      playerScores[i] += roundScore;
      playerScores[j] -= roundScore;
    }
  }

  return playerScores.map((score, index) => {
    const p = playerInfos[index];
    return {
      totalScore: score,
      details: {
        head: { rank: getHandType(p.head, 'head'), score: 0 },
        middle: { rank: getHandType(p.middle, 'middle'), score: 0 },
        tail: { rank: getHandType(p.tail, 'tail'), score: 0 },
      }
    };
  });
}