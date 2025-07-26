// src/game-logic/deck.js
// Thirteen-Water（十三水）牌组相关工具

const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

/**
 * 生成一副 52 张牌
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
 * Fisher–Yates 洗牌
 */
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * 发牌：平均分给 playerCount 名玩家
 */
export function dealCards(deck, playerCount = 4) {
  const hands = Array.from({ length: playerCount }, () => []);
  deck.forEach((card, idx) => {
    hands[idx % playerCount].push(card);
  });
  return hands;
}

/**
 * 智能拆牌：将 13 张手牌拆成 前墩(3)、中墩(5)、后墩(5)
 */
export function SmartSplit(cards) {
  const sorted = cards.slice().sort((a, b) => a.value - b.value);
  return {
    front: sorted.slice(0, 3),
    middle: sorted.slice(3, 8),
    back:   sorted.slice(8, 13)
  };
}

/**
 * 判断十三水是否犯规：
 *   要求 max(front) ≤ min(middle) 且 max(middle) ≤ min(back)
 */
export function isFoul(front, middle, back) {
  const vals = arr => arr.map(c => c.value).sort((a, b) => a - b);
  const f = vals(front), m = vals(middle), b = vals(back);
  if (f[f.length - 1] > m[0]) return true;
  if (m[m.length - 1] > b[0]) return true;
  return false;
}

/**
 * 计算每墩得分（示例：按牌点累加）
 */
export function calcSSSAllScores(front, middle, back) {
  const sum = arr => arr.reduce((s, c) => s + c.value, 0);
  const frontScore  = sum(front);
  const middleScore = sum(middle);
  const backScore   = sum(back);
  return {
    front:  frontScore,
    middle: middleScore,
    back:   backScore,
    total:  frontScore + middleScore + backScore
  };
}