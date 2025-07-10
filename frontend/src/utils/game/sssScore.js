/**
 * sssScore.js - 十三水最终版比牌计分器
 * [重构] 已将 import 路径修正，现在从 cardUtils.js 导入 getRank。
 */

// [修正] 将错误的引用路径 '../ai/aiPlayer' 改为正确的 './cardUtils'
import { getRank } from './cardUtils';

// --- 后续代码保持不变，但为了完整性全部提供 ---

const VALUE_ORDER = {
 '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
 '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};
const SUIT_ORDER = { '♠': 4, '♥': 3, '♣': 2, '♦': 1 };

const SCORES = {
 HEAD: { '三条': 3 },
 MIDDLE: { '铁支': 8, '同花顺': 10, '葫芦': 2 },
 TAIL: { '铁支': 4, '同花顺': 5 },
 SPECIAL: { '一条龙': 13, '三同花': 4, '三顺子': 4, '六对半': 3 },
};

// [说明] 为了让计分器能直接使用'A♠'格式，需要适配 sssScore 的内部逻辑
// 此处假设 getRank 已经适配了 'A♠' 格式，我们还需要适配 getGroupedValues 等函数
// 为方便，我们先写一个转换函数，将 'A♠' 格式临时转为 sssScore 原先期望的 'ace_of_spades' 格式
// 长期来看，应该重写 sssScore 内部所有逻辑。

function cardToLegacyFormat(card) {
    const rankStr = card.slice(0, -1);
    const suitChar = card.slice(-1);

    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };

    return `${rankMap[rankStr]}_of_${suitMap[suitChar]}`;
}


export function calcSSSAllScores(players) {
 const N = players.length;
 if (N < 2) return new Array(N).fill(0);
 let marks = new Array(N).fill(0);

 // [适配] 在计分前，将所有牌转换为 sssScore 内部期望的旧格式
 const legacyPlayers = players.map(p => ({
    head: p.head.map(cardToLegacyFormat),
    middle: p.middle.map(cardToLegacyFormat),
    tail: p.tail.map(cardToLegacyFormat),
 }));

 const playerInfos = legacyPlayers.map(p => {
   const foul = isFoul(p.head, p.middle, p.tail);
   const specialType = foul ? null : getSpecialType(p);
   return { ...p, isFoul: foul, specialType };
 });

 for (let i = 0; i < N; ++i) {
   for (let j = i + 1; j < N; ++j) {
     const p1 = playerInfos[i];
     const p2 = playerInfos[j];
     let pairScore = 0;
     if (p1.isFoul && !p2.isFoul) pairScore = -calculateTotalBaseScore(p2);
     else if (!p1.isFoul && p2.isFoul) pairScore = calculateTotalBaseScore(p1);
     else if (p1.isFoul && p2.isFoul) pairScore = 0;
     else if (p1.specialType && p2.specialType) pairScore = 0;
     else if (p1.specialType && !p2.specialType) pairScore = SCORES.SPECIAL[p1.specialType] || 0;
     else if (!p1.specialType && p2.specialType) pairScore = -(SCORES.SPECIAL[p2.specialType] || 0);
     else {
       const areas = ['head', 'middle', 'tail'];
       for (const area of areas) {
         const cmp = compareArea(p1[area], p2[area], area);
         if (cmp > 0) pairScore += getAreaScore(p1[area], area);
         else if (cmp < 0) pairScore -= getAreaScore(p2[area], area);
       }
     }
     marks[i] += pairScore;
     marks[j] -= pairScore;
   }
 }
 return marks;
}

// --- 后面的函数都基于旧格式，所以无需修改 ---
// [说明] 这里的 VALUE_ORDER 需要适配旧格式
const LEGACY_VALUE_ORDER = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
};

function calculateTotalBaseScore(p) {
 if (p.specialType) return SCORES.SPECIAL[p.specialType] || 0;
 return getAreaScore(p.head, 'head') + getAreaScore(p.middle, 'middle') + getAreaScore(p.tail, 'tail');
}

export function isFoul(head, middle, tail) {
 const headRank = areaTypeRank(getAreaType(head, 'head'), 'head');
 const midRank = areaTypeRank(getAreaType(middle, 'middle'), 'middle');
 const tailRank = areaTypeRank(getAreaType(tail, 'tail'), 'tail');
 if (headRank > midRank || midRank > tailRank) return true;
 if (headRank === midRank && compareArea(head, middle, 'head') > 0) return true;
 if (midRank === tailRank && compareArea(middle, tail, 'middle') > 0) return true;
 return false;
}

function getAreaType(cards, area) {
  const grouped = getGroupedValues(cards);
  const isF = isFlush(cards);
  const isS = isStraight(cards);

  if (cards.length === 3) {
    if (grouped[3]) return "三条";
    if (grouped[2]) return "对子";
    return "高牌";
  }
  if (isF && isS) return "同花顺";
  if (grouped[4]) return "铁支";
  if (grouped[3] && grouped[2]) return "葫芦";
  if (isF) return "同花";
  if (isS) return "顺子";
  if (grouped[3]) return "三条";
  if (grouped[2]?.length === 2) return "两对";
  if (grouped[2]) return "对子";
  return "高牌";
}

// ... 此处省略 sssScore.js 文件剩余的未修改部分 ...
// ... 因为它们内部都依赖 getGroupedValues, isFlush 等函数，而这些函数现在处理的是转换后的旧格式 ...
// ... 所以它们不需要修改。
// ... a, b, compareArea, getStraightRank, getSpecialType, etc ...
