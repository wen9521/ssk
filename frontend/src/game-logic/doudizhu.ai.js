// src/game-logic/doudizhu.ai.js
import { parseHand, canPlay, valueMap, JokerRanks, HandType } from './doudizhu.rules.js';

/**
 * AI决定叫分
 * @param {Array} hand
 * @param {number} currentBid
 */
export function decideBid(hand, currentBid) {
  const bigCards = hand.filter(c => valueMap[c.rank] >= valueMap['2']).length;
  const hasRocket = hand.some(c => c.rank === JokerRanks.RED_JOKER)
                  && hand.some(c => c.rank === JokerRanks.BLACK_JOKER);

  if (hasRocket && bigCards >= 2 && currentBid < 3) return 3;
  if (bigCards >= 4 && currentBid < 3) return 3;
  if (bigCards >= 3 && currentBid < 2) return 2;
  if (bigCards >= 2 && currentBid < 1) return 1;
  return 0;
}

/**
 * AI决定出牌
 * @param {Array} hand
 * @param {{type,value,length}|null} currentHandOnTable
 */
export function decidePlay(hand, currentHandOnTable) {
  const allPlays = findAllPossiblePlays(hand);
  const validPlays = allPlays.filter(p => canPlay(p.parsed, currentHandOnTable));

  if (validPlays.length === 0) return null;

  // 主动出牌：优先大组合，值最小的先出
  if (!currentHandOnTable) {
    validPlays.sort((a, b) => {
      if (b.cards.length !== a.cards.length) return b.cards.length - a.cards.length;
      return a.parsed.value - b.parsed.value;
    });
    return validPlays[0].cards;
  }

  // 跟牌：避炸弹，用最小非炸牌
  const nonBomb = validPlays.filter(p => p.parsed.type !== HandType.BOMB && p.parsed.type !== HandType.ROCKET);
  if (nonBomb.length) {
    nonBomb.sort((a,b)=>a.parsed.value - b.parsed.value);
    return nonBomb[0].cards;
  }
  // 只能炸弹时，出最小炸弹
  const bombs = validPlays.filter(p => p.parsed.type === HandType.BOMB || p.parsed.type === HandType.ROCKET);
  bombs.sort((a,b)=>a.parsed.value - b.parsed.value);
  return bombs[0].cards;
}


// —— 辅助函数 —— //

function findAllPossiblePlays(hand) {
  if (!hand.length) return [];
  const plays = new Set();
  const counts = getCounts(hand);
  const byRank = groupByRank(hand);

  // 单/对/三/炸
  for (let rank in byRank) {
    const group = byRank[rank];
    if (group.length >= 1) plays.add(JSON.stringify(group.slice(0,1)));
    if (group.length >= 2) plays.add(JSON.stringify(group.slice(0,2)));
    if (group.length >= 3) plays.add(JSON.stringify(group.slice(0,3)));
    if (group.length === 4) plays.add(JSON.stringify(group));
  }

  // 火箭
  if (counts[JokerRanks.BLACK_JOKER] && counts[JokerRanks.RED_JOKER]) {
    const bj = byRank[JokerRanks.BLACK_JOKER][0];
    const rj = byRank[JokerRanks.RED_JOKER][0];
    plays.add(JSON.stringify([bj, rj]));
  }

  // 三带一、三带二
  Object.entries(counts).forEach(([r, c]) => {
    if (c === 3) {
      const trio = byRank[r];
      const others = hand.filter(ca=>ca.rank!==r);
      if (others.length) {
        plays.add(JSON.stringify([...trio, others[0]])); // 三带一
      }
      const pairRank = Object.keys(counts).find(rr=>rr!==r && counts[rr]>=2);
      if (pairRank) {
        plays.add(JSON.stringify([...trio, ...byRank[pairRank].slice(0,2)]));
      }
    }
  });

  // 顺子、连对、飞机、四带二等 同理，这里省略实现以示思路
  // 实战中可以借鉴上节示例，逐步补全

  return Array.from(plays).map(str=>{
    const cards = JSON.parse(str);
    return { cards, parsed: parseHand(cards) };
  }).filter(p=>p.parsed.type !== HandType.INVALID);
}

function getCounts(cards) {
  return cards.reduce((o,c)=>{ o[c.rank]=(o[c.rank]||0)+1; return o; }, {});
}
function groupByRank(cards) {
  return cards.reduce((o,c)=>{ (o[c.rank]||(o[c.rank]=[])).push(c); return o; }, {});
}