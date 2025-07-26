import { valueMap } from './doudizhu.rules';

// 注意：此文件现在使用卡牌对象 {rank, suit, value}, 不再是字符串

const VALUE_MAP = valueMap;

const SCORES = {
  HEAD: { '三条': 3 },
  MIDDLE: { '铁支': 8, '同花顺': 10, '葫芦': 2 },
  TAIL: { '铁支': 4, '同花顺': 5 },
  SPECIAL: { '一条龙': 13, '三同花': 4, '三顺子': 4, '六对半': 3 },
};

// --- 工具函数 ---
const uniq = (arr) => [...new Set(arr)];
const groupBy = (arr, fn) => {
  const g = {};
  arr.forEach(x => { const k = fn(x); g[k] = g[k] || []; g[k].push(x); });
  return g;
};
const getCardValue = (card) => card.value;


// --- 牌型判断函数 ---
export function isStraight(cards) {
    if (!cards || cards.length < 3) return false;
    const vals = uniq(cards.map(getCardValue)).sort((a, b) => a - b);
    if (vals.length !== cards.length) return false;
  
    // 处理A-2-3-4-5顺子
    const isAceLow = vals.includes(14) && vals.includes(2);
    if (isAceLow) {
        const tempVals = vals.map(v => v === 14 ? 1 : v).sort((a,b) => a-b);
        for (let i = 0; i < tempVals.length - 1; i++) {
          if (tempVals[i+1] !== tempVals[i] + 1) return false;
        }
        return true;
    }
  
    for (let i = 0; i < vals.length - 1; i++) {
        if (vals[i+1] !== vals[i] + 1) return false;
    }
    return true;
}

export function isFlush(cards) {
  if (!cards || cards.length === 0) return false;
  return uniq(cards.map(c => c.suit)).length === 1;
}

export function getHandType(cards) {
  if (!cards || cards.length === 0) return "高牌";
  
  const vals = cards.map(getCardValue);
  const groupedByValue = groupBy(vals, v => v);
  const counts = Object.values(groupedByValue).map(g => g.length);
  
  const isS = isStraight(cards);
  const isF = isFlush(cards);

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
    if (counts.includes(3)) return "三条";
    if (counts.includes(2)) return "对子";
    return "高牌";
  }
  return "高牌";
}

const HAND_TYPE_RANK_MAP = { "同花顺": 9, "铁支": 8, "葫芦": 7, "同花": 6, "顺子": 5, "三条": 4, "两对": 3, "对子": 2, "高牌": 1 };
export function getHandRank(cards) {
    const type = getHandType(cards);
    return HAND_TYPE_RANK_MAP[type] || 1;
}

export function compareHands(handA, handB) {
    const rankA = getHandRank(handA);
    const rankB = getHandRank(handB);
    if (rankA !== rankB) return rankA - rankB;

    // 如果牌型相同，则进行更细致的比较 (此处为简化版，可按需扩展)
    const sortedValuesA = handA.map(getCardValue).sort((a,b) => b-a);
    const sortedValuesB = handB.map(getCardValue).sort((a,b) => b-a);
    for(let i=0; i < sortedValuesA.length; i++){
        if(sortedValuesA[i] !== sortedValuesB[i]) return sortedValuesA[i] - sortedValuesB[i];
    }
    return 0;
}

export function isFoul(front, middle, back) {
  if (!front || !middle || !back || front.length !== 3 || middle.length !== 5 || back.length !== 5) return true;
  if (compareHands(front, middle) > 0) return true;
  if (compareHands(middle, back) > 0) return true;
  return false;
}

// 维持 calcSSSAllScores 接口，内部使用新的比较函数
export function calcSSSAllScores(playersData) {
    // playersData is an array of { head, middle, tail, isFoul }
    const N = playersData.length;
    if (N < 2) return playersData.map(() => ({ totalScore: 0, details: {} }));
  
    // 省略复杂计分逻辑，保持原文件结构，但内部应使用 compareHands
    // 以下为示意
    const playerScores = Array(N).fill(0);
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            const p1 = playersData[i];
            const p2 = playersData[j];
            let roundScore = 0;
            if(!p1.isFoul && !p2.isFoul) {
                if (compareHands(p1.front, p2.front) > 0) roundScore++; else roundScore--;
                if (compareHands(p1.middle, p2.middle) > 0) roundScore++; else roundScore--;
                if (compareHands(p1.back, p2.back) > 0) roundScore++; else roundScore--;
            }
            // ... 处理倒水、特殊牌型等逻辑
            playerScores[i] += roundScore;
            playerScores[j] -= roundScore;
        }
    }
    
    return playerScores.map(score => ({ totalScore: score, details: {} }));
}