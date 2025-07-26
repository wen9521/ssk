// frontend/src/games/doudizhu/logic/doudizhu.ai.js
import { parseHand, canPlay, HandType } from './doudizhu.rules';

/**
 * 分析手牌，评估其强度
 * @param {Array} hand - AI 的手牌
 * @returns {number} - 一个代表手牌强度的分数
 */
function evaluateHandStrength(hand) {
  let score = 0;
  const counts = hand.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1;
    return acc;
  }, {});

  if (counts['R'] && counts['B']) score += 10; // 王炸
  if (counts['2']) score += counts['2'] * 2; // 2的数量

  // ...可添加更多评估逻辑，如炸弹、顺子等
  
  return score;
}

/**
 * AI 决定叫多少分
 * @param {Array} hand - AI 的手牌
 * @returns {number} - 叫的分数 (0, 1, 2, 3)
 */
export function getAIBid(hand) {
  const strength = evaluateHandStrength(hand);
  if (strength > 10) return 3;
  if (strength > 7) return 2;
  if (strength > 4) return 1;
  return 0; // 不叫
}

/**
 * AI 决定出什么牌
 * @param {Array} aiHand - AI 的手牌
 * @param {Object} lastPlay - 上一家的牌
 * @param {boolean} isLandlord - AI 是否是地主
 * @param {string} nextPlayerRole - 下一个玩家的角色 ('landlord' or 'farmer')
 * @returns {Array|null} - 返回要出的牌，或者 null 表示不出
 */
export function getAIPlay(aiHand, lastPlay, isLandlord, nextPlayerRole) {
  // 1. 找到所有能大过 lastPlay 的出牌组合
  const possiblePlays = findPossiblePlays(aiHand, lastPlay);

  if (possiblePlays.length === 0) {
    return null; // 没有能大过的牌
  }

  // 2. 决策：从中选择最优的出牌
  // 简化策略：
  // - 如果是队友出的牌，非必要情况不要大过
  // - 优先出牌组中价值最低的牌
  // - 如果是地主，并且只剩一张牌，AI农民会用炸弹
  
  // (此处可以实现非常复杂的策略树)

  // 默认返回能出的第一种组合
  return possiblePlays[0];
}

/**
 * 查找所有能大过上一手的出牌组合
 * @private
 */
function findPossiblePlays(hand, lastPlay) {
  const plays = [];
  // ... 此处将包含复杂的搜索算法 ...
  // a. 找出所有可能的单张、对子、三带一、顺子等组合
  // b. 过滤掉不能大过 lastPlay 的组合
  
  // 简化实现：只找单张
  if (!lastPlay || lastPlay.type === HandType.SINGLE) {
    for (const card of hand) {
      const play = parseHand([card]);
      if (canPlay(play, lastPlay)) {
        plays.push([card]);
      }
    }
  }
  
  return plays.sort((a, b) => parseHand(a).value - parseHand(b).value);
}
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