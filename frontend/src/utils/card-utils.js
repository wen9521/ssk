// frontend/src/utils/card-utils.js

const SUITS = ['s', 'h', 'c', 'd'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const JOKERS = [{ suit: 'joker', rank: 'B' }, { suit: 'joker', rank: 'R' }]; // B: Black, R: Red

/**
 * 创建一副可定制的扑克牌
 * @param {object} options - { jokers: boolean }
 * @returns {Array} deck
 */
export function createDeck({ jokers = false } = {}) {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  if (jokers) {
    deck.push(...JOKERS);
  }
  return deck;
}

/**
 * 使用 Fisher-Yates 算法洗牌
 * @param {Array} deck - 要洗的牌堆
 * @returns {Array} - 洗好的牌堆
 */
export function shuffle(deck) {
  let currentIndex = deck.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]];
  }
  return deck;
}

/**
 * 为不同游戏发牌
 * @param {string} gameType - 'doudizhu' or 'thirteenWater'
 * @returns {Object} - 包含手牌和剩余牌的对象
 */
export function deal(gameType) {
  if (gameType === 'doudizhu') {
    const deck = shuffle(createDeck({ jokers: true }));
    const landlordCards = deck.slice(0, 3);
    const playerDeck = deck.slice(3);
    const hands = Array.from({ length: 3 }, (_, i) => 
      playerDeck.slice(i * 17, (i + 1) * 17)
    );
    return { hands, landlordCards };
  }

  if (gameType === 'thirteenWater') {
    const deck = shuffle(createDeck());
    const hands = Array.from({ length: 2 }, (_, i) => 
      deck.slice(i * 13, (i + 1) * 13)
    );
    // In a 2 player game, 26 cards are used.
    return { hands };
  }

  // Default case
  return { hands: [], remainingDeck: shuffle(createDeck()) };
}
