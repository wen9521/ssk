// frontend/src/utils/game/cardUtils.js

const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠', '♥', '♦', '♣'];

// 牌面英文映射 (用于图片)
const rankMap = {
  'A': 'ace', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10', 'J': 'jack', 'Q': 'queen', 'K': 'king'
};
const suitMap = {
  '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs'
};

/**
 * 创建一副标准的52张扑克牌。
 * @returns {string[]} e.g., ["A♠", "K♠", ...]
 */
export function createDeck() {
  const deck = [];
  for (const rank of ranks) {
    for (const suit of suits) {
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
 * 获取卡牌的点数值。
 * @param {string} card - e.g., 'A♠', '10♥'.
 * @returns {number} Rank value (2-14, 14 for Ace).
 */
export function getRank(card) {
  if (!card || typeof card !== 'string' || card.length < 2) return 0;
  const rankStr = card.length > 2 ? card.substring(0, 2) : card.substring(0, 1);
  switch (rankStr) {
    case 'A': return 14;
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    default: return parseInt(rankStr, 10) || 0;
  }
}

/**
 * 获取卡牌的花色。
 * @param {string} card - e.g., 'A♠'
 * @returns {string} Suit symbol e.g., '♠'
 */
export function getSuit(card) {
    if (!card || typeof card !== 'string' || card.length < 2) return '';
    return card.slice(-1);
}

/**
 * 根据卡牌字符串获取对应的图片URL。
 * @param {string} card - e.g., "A♠", "10♣"
 * @returns {string} 图片路径 e.g., "/cards/ace_of_spades.svg"
 */
export function getCardImageUrl(card) {
  if (!card || card.length < 2) return '/cards/red_joker.svg'; // 返回一个默认背面图
  const rankStr = card.length > 2 ? card.substring(0, 2) : card.substring(0, 1);
  const suitStr = card.slice(-1);

  const rank = rankMap[rankStr];
  const suit = suitMap[suitStr];

  if (!rank || !suit) return '/cards/red_joker.svg';

  return `/cards/${rank}_of_${suit}.svg`;
}


/**
 * 【新增的发牌模块】
 * 创建、清洗并向指定数量的玩家发牌。
 * @param {number} numPlayers - 玩家数量.
 * @returns {{fullDeck: string[], playerHands: string[][]}} 返回包含完整牌组和每个玩家手牌的对象
 */
export function dealCards(numPlayers = 4) {
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  let currentDeck = [...shuffledDeck];
  
  const playerHands = Array(numPlayers).fill(null).map(() => []);

  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < numPlayers; j++) {
      if(currentDeck.length > 0) {
        playerHands[j].push(currentDeck.pop());
      }
    }
  }

  return {
    fullDeck: shuffledDeck, // 返回洗好的整副牌用于动画
    playerHands: playerHands // 返回最终每个玩家的手牌
  };
}
