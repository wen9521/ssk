export function createDeck() {
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const suits = ['♠', '♥', '♦', '♣'];
  const deck = [];
  for (const rank of ranks) {
    for (const suit of suits) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(shuffledDeck) {
  if (shuffledDeck.length < 13) {
    console.error("Shuffled deck must contain at least 13 cards to deal a hand.");
    return null;
  }

  const playerHand = shuffledDeck.slice(0, 13);
  const dun1 = playerHand.slice(0, 3);
  const dun2 = playerHand.slice(3, 8);
  const dun3 = playerHand.slice(8, 13);

  return {
    dun1,
    dun2,
    dun3
  };
}