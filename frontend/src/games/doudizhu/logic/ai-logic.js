import {
  isStraight,
  isFlush,
  getHandType,
  isFoul,
  compareHands
} from './thirteen-water-rules'; // 从权威文件导入规则

// --- AI 工具函数 (操作卡牌对象) ---
const getCardValue = (card) => card.value;
const getCardSuit = (card) => card.suit;
const uniq = (arr) => [...new Set(arr)];
const groupBy = (arr, fn) => {
    const g = {};
    arr.forEach(x => { const k = fn(x); g[k] = g[k] || []; g[k].push(x); });
    return g;
};
const combinations = (arr, k) => {
    let res = [];
    function comb(path, start) {
        if (path.length === k) return res.push(path);
        for (let i = start; i < arr.length; ++i) comb([...path, arr[i]], i + 1);
    }
    comb([], 0);
    return res;
};
const sortCardsForAI = (cards) => {
    return [...cards].sort((a, b) => b.value - a.value || getCardSuit(b).localeCompare(getCardSuit(a)));
};

// --- 特殊牌型检测 (使用导入的规则) ---
function detectSpecialSplit(cards13) {
  // 示例：三顺子检测
  const comb3 = combinations(cards13, 3);
  for (const head of comb3) {
    if (!isStraight(head)) continue;
    const left10 = cards13.filter(c => !head.includes(c));
    for (const mid of combinations(left10, 5)) {
      if (!isStraight(mid)) continue;
      const tail = left10.filter(c => !mid.includes(c));
      if (isStraight(tail) && !isFoul(head, mid, tail)) {
        return { head, middle: mid, tail, type: '三顺子' };
      }
    }
  }
  // ... 其他特殊牌型检测
  return null;
}


// --- 评估函数 (使用导入的规则) ---
function scoreSplit(head, mid, tail) {
    // 简化的评估逻辑，真实AI会更复杂
    let score = 0;
    score += compareHands(tail, []) * 3; // 假设compareHands能处理
    score += compareHands(mid, []) * 2;
    score += compareHands(head, []) * 1;

    // 特殊牌型加分
    if (getHandType(head) === '三条') score += 50;
    if (getHandType(mid) === '葫芦') score += 100;
    
    return score;
}

// --- 智能理牌主函数 ---
export function SmartSplit(cards13) {
    const special = detectSpecialSplit(cards13);
    if (special) return [special];

    let bestSplit = null;
    let bestScore = -Infinity;

    // 这是一个计算密集型操作，实际应用中需要优化
    // 此处仅为逻辑示意，使用贪心或启发式搜索更佳
    const allPossibleTails = combinations(cards13, 5);
    
    // 随机选择一部分组合进行评估，避免卡死
    for(let i=0; i < Math.min(allPossibleTails.length, 50); i++){
        const tail = allPossibleTails[i];
        const remaining8 = cards13.filter(c => !tail.includes(c));
        const allPossibleMiddles = combinations(remaining8, 5);

        for (const mid of allPossibleMiddles) {
            const head = remaining8.filter(c => !mid.includes(c));
            if (!isFoul(head, mid, tail)) {
                const currentScore = scoreSplit(head, mid, tail);
                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    bestSplit = { head, middle: mid, tail };
                }
            }
        }
    }

    if (bestSplit) return [bestSplit];

    // 如果没找到好的，返回一个保底的基础排序
    const sorted = sortCardsForAI(cards13);
    return [{ head: sorted.slice(8, 11), middle: sorted.slice(3, 8), tail: sorted.slice(0, 3) }];
}