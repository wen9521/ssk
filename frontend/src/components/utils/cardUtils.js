// 生成一副52张牌 + 2张Joker
export const generateDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
  const jokers = ['red_joker', 'black_joker'];
  
  const deck = [];
  
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push(`${rank}_of_${suit}`);
    });
  });
  
  return [...deck, ...jokers];
};

// 洗牌算法
export const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 分牌给玩家 (模拟)
export const dealCards = (playerCount) => {
  const deck = shuffleDeck(generateDeck());
  const players = Array.from({ length: playerCount }, () => []);
  
  for (let i = 0; i < 13; i++) {
    for (let p = 0; p < playerCount; p++) {
      if (deck.length > 0) {
        players[p].push(deck.pop());
      }
    }
  }
  
  return players;
};