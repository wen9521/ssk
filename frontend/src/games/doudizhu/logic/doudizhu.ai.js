// frontend/src/games/doudizhu/logic/doudizhu.ai.js
import { parseHand, canPlay, हैंड_टाइप } from './doudizhu.rules';

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
  
  return score;
}

/**
 * AI 决定叫多少分 (Restored Function)
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
 * @returns {Array|null} - 返回要出的牌，或者 null 表示不出
 */
export function getAIPlay(aiHand, lastPlay) {
  const possiblePlays = findPossiblePlays(aiHand, lastPlay);
  if (possiblePlays.length === 0) {
    return null;
  }
  return possiblePlays[0];
}

/**
 * 查找所有能大过上一手的出牌组合
 * @private
 */
function findPossiblePlays(hand, lastPlay) {
  const plays = [];
  if (!lastPlay || lastPlay.type === हैंड_टाइप.SINGLE) {
    for (const card of hand) {
      const play = parseHand([card]);
      if (canPlay(play, lastPlay)) {
        plays.push([card]);
      }
    }
  }
  return plays.sort((a, b) => parseHand(a).value - parseHand(b).value);
}
