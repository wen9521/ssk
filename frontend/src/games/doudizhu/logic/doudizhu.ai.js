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
