// 发牌模块
export const getShuffledDeck = () => {
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
  const suits = ['spades', 'hearts', 'clubs', 'diamonds'];
  const deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push(`${value}_of_${suit}`);
    }
  }

  // Fisher-Yates (Knuth) Shuffle Algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

export const dealHands = (deck, numPlayers) => {
  if (!deck || deck.length === 0 || numPlayers <= 0) {
    return []; // Handle invalid input
  }

  const hands = new Array(numPlayers).fill(null).map(() => []);
  let cardIndex = 0;

  while (cardIndex < deck.length) {
    for (let i = 0; i < numPlayers; i++) {
      if (cardIndex < deck.length) {
        hands[i].push(deck[cardIndex]);
        cardIndex++;
      } else {
        break; // No more cards to deal
      }
    }
  }

  return hands;
};