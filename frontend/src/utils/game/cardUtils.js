// src/utils/game/cardUtils.js

// [重构] 这是唯一的、权威的卡牌工具文件。
// [新增] 添加了 getHandType 函数用于判断牌型。

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

/**
 * 创建一副标准的52张扑克牌。
 * @returns {string[]} e.g., ["A♠", "K♠", ...]
 */
export function createDeck() {
  const deck = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

/**
 * 洗牌算法 (Fisher-Yates shuffle)。
 * @param {string[]} deck - 牌组.
 * @returns {string[]} 洗过的牌组.
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 统一的获取卡牌点数值的函数。
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
 * 统一的获取卡牌花色的函数。
 * @param {string} card - e.g., 'A♠'
 * @returns {string} Suit symbol e.g., '♠'
 */
export function getSuit(card) {
    if (!card || typeof card !== 'string' || card.length < 2) return '';
    return card.slice(-1);
}

/**
 * 统一的发牌模块。
 * @param {number} numPlayers - 玩家数量.
 * @returns {{fullDeck: string[], playerHands: string[][]}}
 */
export function dealCards(numPlayers = 4) {
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  
  const playerHands = Array(numPlayers).fill(null).map(() => []);
  for (let i = 0; i < 52; i++) {
    if (i < 13 * numPlayers) {
      playerHands[i % numPlayers].push(shuffledDeck[i]);
    }
  }

  return {
    fullDeck: shuffledDeck, 
    playerHands: playerHands
  };
}

/**
 * [新增] 强大的牌型判断函数
 * @param {string[]} cards - 一组牌, e.g., ['A♠', 'K♠', 'Q♠', 'J♠', '10♠']
 * @returns {string} 牌型名称, e.g., "同花顺"
 */
export function getHandType(cards) {
    if (!cards || cards.length === 0) return '';
    
    const ranks = cards.map(getRank);
    const suits = cards.map(getSuit);

    const rankCounts = ranks.reduce((acc, rank) => {
        acc[rank] = (acc[rank] || 0) + 1;
        return acc;
    }, {});

    const counts = Object.values(rankCounts);
    const isFlush = new Set(suits).size === 1;
    
    const sortedUniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
    let isStraight = false;
    if (sortedUniqueRanks.length === cards.length) {
        // 普通顺子
        isStraight = sortedUniqueRanks[sortedUniqueRanks.length - 1] - sortedUniqueRanks[0] === cards.length - 1;
        // A-5 顺子 (10-J-Q-K-A不算)
        if (!isStraight && JSON.stringify(sortedUniqueRanks) === JSON.stringify([2, 3, 4, 5, 14])) {
            isStraight = true;
        }
    }
    
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
