// src/game-logic/deck.js
// Thirteen‐Water（十三水）牌组相关工具

// 花色与点数顺序定义
const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

/**
 * 生成一副 52 张牌（十三水）
 * @returns {Array<{ rank: string, suit: string, value: number }>}
 */
export function createDeck() {
  const deck = [];
  RANKS.forEach((rank, idx) => {
    SUITS.forEach(suit => {
      deck.push({ rank, suit, value: idx + 1 });
    });
  });
  return deck;
}

/**
 * Fisher–Yates 洗牌算法
 * @param {Array} deck
 * @returns {Array} 洗好的牌堆（就地乱序）
 */
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * 发牌：将整副牌平均发给 playerCount 名玩家
 * @param {Array} deck
 * @param {number} playerCount
 * @returns {Array<Array>} 每个玩家的手牌数组
 */
export function dealCards(deck, playerCount = 4) {
  const hands = Array.from({ length: playerCount }, () => []);
  deck.forEach((card, idx) => {
    hands[idx % playerCount].push(card);
  });
  return hands;
}

/**
 * 智能拆牌：将 13 张手牌拆分成 前墩(3)、中墩(5)、后墩(5)
 * 简单策略：按点数排序后依次切分
 * @param {Array} cards - 13 张手牌
 * @returns {{ front: Array, middle: Array, back: Array }}
 */
export function SmartSplit(cards) {
  const sorted = cards.slice().sort((a, b) => a.value - b.value);
  return {
    front: sorted.slice(0, 3),
    middle: sorted.slice(3, 8),
    back:   sorted.slice(8, 13)
  };
}