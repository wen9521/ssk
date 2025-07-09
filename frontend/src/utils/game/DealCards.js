// frontend/src/utils/game/DealCards.js

const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

/**
 * 创建一副标准的52张扑克牌，格式为 'ace_of_spades'.
 * @returns {string[]} e.g., ["ace_of_spades", "king_of_spades", ...]
 */
function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank}_of_${suit}`);
    }
  }
  return deck;
}

/**
 * 洗牌算法 (Fisher-Yates shuffle).
 * @param {string[]} deck - 牌组.
 * @returns {string[]} 洗过的牌组.
 */
export function getShuffledDeck() {
  const deck = createDeck();
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 向4个玩家发牌。
 * @param {string[]} deck - 洗好的牌组.
 * @returns {string[][]} 包含4个玩家手牌的数组
 */
export function dealHands(deck) {
  const hands = [[], [], [], []];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 4; j++) {
      hands[j].push(deck[i * 4 + j]);
    }
  }
  return hands;
}
