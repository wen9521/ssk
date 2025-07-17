// 扑克牌生成和发牌逻辑
const SUITS = ['S', 'H', 'D', 'C']; // 黑桃、红心、方片、梅花
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const getShuffledDeck = () => {
  // 生成一副洗好的牌
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  
  // Fisher-Yates洗牌算法
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
};

export const dealHands = (deck) => {
  // 发四手牌（玩家+3个AI）
  const hands = [[], [], [], []];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 4; j++) {
      hands[j].push(deck.pop());
    }
  }
  return hands;
};
