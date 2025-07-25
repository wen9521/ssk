// frontend/src/game-logic/doudizhu.ai.js
import { parseHand, canPlay, valueMap, JokerRanks, HandType } from './doudizhu.rules.js';

/**
 * AI决定叫分。这是一个简单的启发式算法。
 * @param {Array} hand - AI的手牌
 * @param {number} currentBid - 当前的最高叫分
 * @returns {number} - AI决定叫的分数 (1, 2, 3) 或不叫 (0)
 */
export function decideBid(hand, currentBid) {
  const bigCards = hand.filter(c => valueMap[c.rank] >= valueMap['2']).length;
  const hasRocket = hand.some(c => c.rank === JokerRanks.RED_JOKER) && hand.some(c => c.rank === JokerRanks.BLACK_JOKER);

  if (hasRocket && bigCards >= 2 && currentBid < 3) return 3;
  if (bigCards >= 4 && currentBid < 3) return 3;
  if (bigCards >= 3 && currentBid < 2) return 2;
  if (bigCards >= 2 && currentBid < 1) return 1;
  return 0; // 不叫
}

/**
 * AI决定出牌。这是AI的核心决策函数。
 * @param {Array} hand - AI的手牌
 * @param {Object|null} currentHandOnTable - 当前桌面上需要大的牌
 * @returns {Array|null} - AI决定出的牌，如果不出则返回null
 */
export function decidePlay(hand, currentHandOnTable) {
  const allPlays = findAllPossiblePlays(hand);
  
  // 筛选出所有能打得过当前桌面牌的组合
  const validPlays = allPlays.filter(play => canPlay(play.parsed, currentHandOnTable));

  if (validPlays.length === 0) {
    return null; // 没有任何牌能大过，选择“不出”
  }

  // 如果轮到AI主动出牌
  if (!currentHandOnTable) {
    // 简单策略：优先出组合牌，然后出价值最低的牌，尽快脱手小牌。
    validPlays.sort((a, b) => {
      // 优先出手里牌数多的组合（飞机/顺子等）
      if (a.cards.length !== b.cards.length) {
        return b.cards.length - a.cards.length;
      }
      // 牌数相同，出点数小的
      return a.parsed.value - b.parsed.value;
    });
    return validPlays[0].cards;
  }
  
  // 如果是跟牌，则需要策略
  // 策略：用最小的代价去大过对方，非必要情况不出炸弹。
  const nonBombPlays = validPlays.filter(p => p.parsed.type !== HandType.BOMB && p.parsed.type !== HandType.ROCKET);
  const bombPlays = validPlays.filter(p => p.parsed.type === HandType.BOMB || p.parsed.type === HandType.ROCKET);
  
  // 优先出非炸弹的牌
  if (nonBombPlays.length > 0) {
    // 从能打过的牌里，选一个最小的
    nonBombPlays.sort((a, b) => a.parsed.value - b.parsed.value);
    return nonBombPlays[0].cards;
  }

  // 如果只能出炸弹
  if (bombPlays.length > 0) {
    // 更高级的AI会在这里判断是否值得出炸弹，目前简单处理：如果必须出，就出最小的炸弹
    bombPlays.sort((a, b) => a.parsed.value - b.parsed.value);
    return bombPlays[0].cards;
  }
  
  return null; // 理论上不可达
}


// --- 辅助函数 ---

/**
 * 找出手中所有可能的出牌组合。
 * @param {Array} hand - AI的手牌
 * @returns {Array} - 所有可能的出牌组合的列表
 */
function findAllPossiblePlays(hand) {
    if (!hand || hand.length === 0) return [];

    let plays = new Set();
    const counts = getCardCounts(hand);
    const cardsByRank = getCardsByRank(hand);

    // 1. 找出单张、对子、三条、炸弹
    for (const rank in cardsByRank) {
        const cards = cardsByRank[rank];
        if (cards.length >= 1) plays.add(JSON.stringify(cards.slice(0, 1)));
        if (cards.length >= 2) plays.add(JSON.stringify(cards.slice(0, 2)));
        if (cards.length >= 3) plays.add(JSON.stringify(cards.slice(0, 3)));
        if (cards.length === 4) plays.add(JSON.stringify(cards));
    }

    // 2. 找出火箭
    if (counts[JokerRanks.BLACK_JOKER] && counts[JokerRanks.RED_JOKER]) {
        plays.add(JSON.stringify([cardsByRank[JokerRanks.BLACK_JOKER][0], cardsByRank[JokerRanks.RED_JOKER][0]]));
    }

    // 3. 找出三带一、三带二
    const trios = getRanksByCount(counts, 3);
    for (const trioRank of trios) {
        const mainCards = cardsByRank[trioRank];
        const otherCards = hand.filter(c => c.rank !== trioRank);
        if (otherCards.length > 0) {
            plays.add(JSON.stringify([...mainCards, otherCards[0]])); // 三带一
            const otherPairs = Object.entries(getCardCounts(otherCards)).filter(([_, count]) => count >= 2);
            if (otherPairs.length > 0) {
                const pairRank = otherPairs[0][0];
                plays.add(JSON.stringify([...mainCards, ...cardsByRank[pairRank].slice(0, 2)])); // 三带二
            }
        }
    }
    
    // 4. 找出顺子 (长度5到12)
    const straightCandidates = getRanksByCount(counts, 1).filter(rank => valueMap[rank] < valueMap['2']);
    for (let len = 5; len <= 12 && len <= straightCandidates.length; len++) {
        for (let i = 0; i <= straightCandidates.length - len; i++) {
            const subRanks = straightCandidates.slice(i, i + len);
            if (isContinuous(subRanks.map(r => valueMap[r]))) {
                plays.add(JSON.stringify(subRanks.map(r => cardsByRank[r][0])));
            }
        }
    }

    // 5. 找出连对 (长度 >= 3)
    const doubleStraightCandidates = getRanksByCount(counts, 2).filter(rank => valueMap[rank] < valueMap['2']);
    for (let len = 3; len <= doubleStraightCandidates.length; len++) {
        for (let i = 0; i <= doubleStraightCandidates.length - len; i++) {
            const subRanks = doubleStraightCandidates.slice(i, i + len);
            if (isContinuous(subRanks.map(r => valueMap[r]))) {
                plays.add(JSON.stringify(subRanks.flatMap(r => cardsByRank[r].slice(0, 2))));
            }
        }
    }

    // 6. 找出飞机 (带/不带翅膀)
    const airplaneCandidates = getRanksByCount(counts, 3).filter(rank => valueMap[rank] < valueMap['2']);
    for (let len = 2; len <= airplaneCandidates.length; len++) {
        for (let i = 0; i <= airplaneCandidates.length - len; i++) {
            const subRanks = airplaneCandidates.slice(i, i + len);
            if (isContinuous(subRanks.map(r => valueMap[r]))) {
                const mainCards = subRanks.flatMap(r => cardsByRank[r]);
                plays.add(JSON.stringify(mainCards)); // 飞机不带翅膀

                const remainingCards = hand.filter(c => !mainCards.some(mc => mc.rank === c.rank && mc.suit === c.suit));
                if (remainingCards.length >= len) {
                    // 带单张翅膀
                    const singleWings = getUniqueCardsByRank(remainingCards).slice(0, len);
                    if (singleWings.length === len) {
                        plays.add(JSON.stringify([...mainCards, ...singleWings]));
                    }

                    // 带对子翅膀
                    const pairWingsCandidates = getCardsByRank(remainingCards);
                    const pairWings = Object.values(pairWingsCandidates).filter(cards => cards.length >= 2).slice(0, len);
                    if (pairWings.length === len) {
                        plays.add(JSON.stringify([...mainCards, ...pairWings.flatMap(p => p.slice(0, 2))]));
                    }
                }
            }
        }
    }
    
    // 7. 找出四带二
    const fours = getRanksByCount(counts, 4);
    for (const fourRank of fours) {
        const mainCards = cardsByRank[fourRank];
        const remainingCards = hand.filter(c => c.rank !== fourRank);
        if(remainingCards.length >= 2) {
             // 四带二单
            plays.add(JSON.stringify([...mainCards, remainingCards[0], remainingCards[1]]));
            // 四带二对
            const remainingPairs = Object.values(getCardsByRank(remainingCards)).filter(cards => cards.length >= 2);
            if(remainingPairs.length >= 2) {
                 plays.add(JSON.stringify([...mainCards, ...remainingPairs[0].slice(0,2), ...remainingPairs[1].slice(0,2)]));
            }
        }
    }

    // 解析所有找到的组合并返回
    return Array.from(plays)
        .map(p => JSON.parse(p))
        .map(cards => ({ cards, parsed: parseHand(cards) }))
        .filter(play => play.parsed && play.parsed.type !== HandType.INVALID);
}

function getCardCounts(cards) {
    return cards.reduce((acc, card) => {
        acc[card.rank] = (acc[card.rank] || 0) + 1;
        return acc;
    }, {});
}

function getCardsByRank(hand) {
    return hand.reduce((acc, card) => {
        if (!acc[card.rank]) acc[card.rank] = [];
        acc[card.rank].push(card);
        return acc;
    }, {});
}

function getUniqueCardsByRank(cards) {
    const seenRanks = new Set();
    return cards.filter(card => {
        if (seenRanks.has(card.rank)) return false;
        seenRanks.add(card.rank);
        return true;
    });
}

function getRanksByCount(counts, count) {
    return Object.keys(counts)
        .filter(rank => counts[rank] >= count)
        .sort((a, b) => valueMap[a] - valueMap[b]);
}

function isContinuous(values) {
    if (values.length < 2 || values.some(v => v >= valueMap['2'])) return false;
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i + 1] - values[i] !== 1) return false;
    }
    return true;
}
