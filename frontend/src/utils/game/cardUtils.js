// src/utils/game/cardUtils.js

// [最终修正版] 确保所有函数都存在、健壮且能正确返回值。

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

/**
 * [加固] 创建一副标准的52张扑克牌。
 * @returns {string[]} e.g., ["A♠", "K♠", ...]
 */
export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

/**
 * [加固] 洗牌算法 (Fisher-Yates shuffle)。
 * @param {string[]} deck - 牌组.
 * @returns {string[]} 洗过的牌组.
 */
export function shuffleDeck(deck) {
  if (!deck || !Array.isArray(deck)) return []; // 安全检查
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * [修正] 统一的发牌模块，使用更简洁可靠的逻辑。
 * @param {number} numPlayers - 玩家数量.
 * @returns {{fullDeck: string[], playerHands: string[][]}}
 */
export function dealCards(numPlayers = 4) {
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  
  const playerHands = Array(numPlayers).fill(null).map(() => []);

  // 确保所有牌都被发出
  for (let i = 0; i < shuffledDeck.length; i++) {
    const playerIndex = i % numPlayers;
    if (playerHands[playerIndex].length < 13) {
      playerHands[playerIndex].push(shuffledDeck[i]);
    }
  }

  return {
    fullDeck: shuffledDeck, 
    playerHands: playerHands
  };
}

/**
 * [加固] 统一的获取卡牌点数值的函数。
 * @param {string} card - e.g., 'A♠', '10♥'.
 * @returns {number} Rank value (2-14, 14 for Ace).
 */
export function getRank(card) {
  if (!card || typeof card !== 'string' || card.length < 2) return 0;
  const rankStr = card.slice(0, -1);
  switch (rankStr) {
    case 'A': return 14;
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    default: return parseInt(rankStr, 10) || 0;
  }
}

/**
 * [加固] 统一的获取卡牌花色的函数。
 * @param {string} card - e.g., 'A♠'
 * @returns {string} Suit symbol e.g., '♠'
 */
export function getSuit(card) {
    if (!card || typeof card !== 'string' || card.length < 2) return '';
    return card.slice(-1);
}

/**
 * [加固] 强大的牌型判断函数
 * @param {string[]} cards - 一组牌
 * @returns {string} 牌型名称
 */
export function getHandType(cards) {
    if (!cards || !Array.isArray(cards) || cards.length === 0) return "无";
    
    const ranks = cards.map(getRank).sort((a, b) => a - b);
    const suits = cards.map(getSuit);

    const rankCounts = ranks.reduce((acc, rank) => { acc[rank] = (acc[rank] || 0) + 1; return acc; }, {});
    const counts = Object.values(rankCounts);
    
    const isFlush = new Set(suits).size === 1;
    const isStraight = (() => {
        const uniqueRanks = [...new Set(ranks)];
        if (uniqueRanks.length !== cards.length) return false;
        if (uniqueRanks[uniqueRanks.length - 1] - uniqueRanks[0] === cards.length - 1) return true;
        if (JSON.stringify(uniqueRanks) === JSON.stringify([2, 3, 4, 5, 14])) return true;
        return false;
    })();
    
    if (cards.length === 5) {
        if (isStraight && isFlush) return "同花顺";
        if (counts.includes(4)) return "铁支";
        if (counts.includes(3) && counts.includes(2)) return "葫芦";
        if (isFlush) return "同花";
        if (isStraight) return "顺子";
    }

    if (counts.includes(3)) return "三条";
    if (counts.filter(c => c === 2).length === 2) return "两对";
    if (counts.includes(2)) return "对子";
    
    return "散牌";
}

/**
 * [加固] 比较两手牌大小（在牌型相同时调用）
 * @returns {number} 1: hand1 > hand2, -1: hand1 < hand2, 0: a === b
 */
export function compareHands(hand1, hand2) {
    if (!hand1 || !hand2) return 0;
    const ranks1 = hand1.map(getRank).sort((a, b) => b - a);
    const ranks2 = hand2.map(getRank).sort((a, b) => b - a);
    for (let i = 0; i < ranks1.length; i++) {
        if (ranks1[i] !== ranks2[i]) {
            return ranks1[i] > ranks2[i] ? 1 : -1;
        }
    }
    return 0;
}

/**
 * [加固] 权威的“倒水”判断函数
 * @returns {boolean} true 如果倒水, false 如果没有
 */
export function isFoul(dun1, dun2, dun3) {
    if (!dun1 || !dun2 || !dun3 || dun1.length !== 3 || dun2.length !== 5 || dun3.length !== 5) {
      return false; 
    }

    const handTypes = ["无", "散牌", "对子", "两对", "三条", "顺子", "同花", "葫芦", "铁支", "同花顺"];
    
    const type1 = getHandType(dun1);
    const type2 = getHandType(dun2);
    const type3 = getHandType(dun3);

    const rank1 = handTypes.indexOf(type1);
    const rank2 = handTypes.indexOf(type2);
    const rank3 = handTypes.indexOf(type3);

    if (rank1 > rank2 || rank2 > rank3) {
        return true;
    }

    if (rank1 === rank2 && compareHands(dun1, dun2) > 0) {
        return true;
    }

    if (rank2 === rank3 && compareHands(dun2, dun3) > 0) {
        return true;
    }

    return false;
}
