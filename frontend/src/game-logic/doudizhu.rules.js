// frontend/src/game-logic/doudizhu.rules.js

import { createDeck, shuffleDeck, sortCards } from './deck';

const Ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const JokerRanks = { BLACK_JOKER: 'Black Joker', RED_JOKER: 'Red Joker' };

export const valueMap = {
  ...Ranks.reduce((map, rank, i) => ({ ...map, [rank]: i + 3 }), {}),
  [JokerRanks.BLACK_JOKER]: 16,
  [JokerRanks.RED_JOKER]: 17,
};

export const HandType = {
  INVALID: 'INVALID', SINGLE: 'SINGLE', PAIR: 'PAIR', TRIO: 'TRIO',
  TRIO_WITH_SINGLE: 'TRIO_WITH_SINGLE', TRIO_WITH_PAIR: 'TRIO_WITH_PAIR',
  STRAIGHT: 'STRAIGHT', DOUBLE_STRAIGHT: 'DOUBLE_STRAIGHT', AIRPLANE: 'AIRPLANE',
  AIRPLANE_WITH_SINGLES: 'AIRPLANE_WITH_SINGLES', AIRPLANE_WITH_PAIRS: 'AIRPLANE_WITH_PAIRS',
  FOUR_WITH_TWO_SINGLES: 'FOUR_WITH_TWO_SINGLES', FOUR_WITH_TWO_PAIRS: 'FOUR_WITH_TWO_PAIRS',
  BOMB: 'BOMB', ROCKET: 'ROCKET',
};

function getCardCounts(cards) {
  return cards.reduce((acc, card) => {
    acc[card.rank] = (acc[card.rank] || 0) + 1;
    return acc;
  }, {});
}
function getRanksByCount(counts, count) {
  return Object.keys(counts).filter(rank => counts[rank] === count).map(rank => valueMap[rank]).sort((a, b) => a - b);
}
function isContinuous(values) {
    if (values.length < 2 || values.some(v => v >= valueMap['2'])) return false;
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i+1] - values[i] !== 1) return false;
    }
    return true;
}

export function parseHand(cards) {
  if (!cards || cards.length === 0) return null;
  const len = cards.length;
  const counts = getCardCounts(cards);
  const mainValue = (ranks) => ranks.length > 0 ? Math.min(...ranks) : 0;
  const singles = getRanksByCount(counts, 1);
  const pairs = getRanksByCount(counts, 2);
  const trios = getRanksByCount(counts, 3);
  const fours = getRanksByCount(counts, 4);

  if (len === 2 && singles.length === 2 && singles.includes(valueMap[JokerRanks.BLACK_JOKER]) && singles.includes(valueMap[JokerRanks.RED_JOKER]))
    return { type: HandType.ROCKET, value: Infinity, length: 2, cards };
  if (len === 4 && fours.length === 1)
    return { type: HandType.BOMB, value: mainValue(fours), length: 4, cards };
  if (len === 1)
    return { type: HandType.SINGLE, value: mainValue(singles), length: 1, cards };
  if (len === 2 && pairs.length === 1)
    return { type: HandType.PAIR, value: mainValue(pairs), length: 2, cards };
  if (len === 3 && trios.length === 1)
    return { type: HandType.TRIO, value: mainValue(trios), length: 3, cards };
  if (len === 4 && trios.length === 1 && singles.length === 1)
    return { type: HandType.TRIO_WITH_SINGLE, value: mainValue(trios), length: 4, cards };
  if (len === 5 && trios.length === 1 && pairs.length === 1)
    return { type: HandType.TRIO_WITH_PAIR, value: mainValue(trios), length: 5, cards };
  if (len === 6 && fours.length === 1 && singles.length === 2)
    return { type: HandType.FOUR_WITH_TWO_SINGLES, value: mainValue(fours), length: 6, cards };
  if (len === 8 && fours.length === 1 && pairs.length === 2)
    return { type: HandType.FOUR_WITH_TWO_PAIRS, value: mainValue(fours), length: 8, cards };
  if (len >= 5 && singles.length === len && isContinuous(singles))
    return { type: HandType.STRAIGHT, value: mainValue(singles), length: len, cards };
  if (len >= 6 && len % 2 === 0 && pairs.length === len / 2 && isContinuous(pairs))
    return { type: HandType.DOUBLE_STRAIGHT, value: mainValue(pairs), length: len / 2, cards };
  if (len >= 6 && len % 3 === 0 && trios.length === len / 3 && isContinuous(trios))
    return { type: HandType.AIRPLANE, value: mainValue(trios), length: len / 3, cards};
  if (len >= 8 && len % 4 === 0 && trios.length === len / 4 && singles.length === len / 4 && isContinuous(trios))
    return { type: HandType.AIRPLANE_WITH_SINGLES, value: mainValue(trios), length: len / 4, cards };
  if (len >= 10 && len % 5 === 0 && trios.length === len / 5 && pairs.length === len / 5 && isContinuous(trios))
    return { type: HandType.AIRPLANE_WITH_PAIRS, value: mainValue(trios), length: len / 5, cards };
  
  return { type: HandType.INVALID, value: 0, cards };
}
export function canPlay(newHand, currentHand) {
  if (!newHand || newHand.type === HandType.INVALID) return false;
  if (!currentHand) return true;
  if (newHand.type === HandType.ROCKET) return true;
  if (currentHand.type === HandType.ROCKET) return false;
  if (newHand.type === HandType.BOMB && currentHand.type !== HandType.BOMB) return true;
  if (newHand.type === HandType.BOMB && currentHand.type === HandType.BOMB) {
    return newHand.value > currentHand.value;
  }
  if (newHand.type !== currentHand.type || newHand.length !== currentHand.length) {
    return false;
  }
  return newHand.value > currentHand.value;
}

export class DoudizhuGame {
  constructor(playerIds, humanPlayerId) {
    this.players = playerIds.map(id => ({ id, hand: [] }));
    this.humanPlayerId = humanPlayerId;
    this.landlordId = null;
    this.landlordCards = [];
    this.currentPlayerId = null;
    this.currentHand = null;
    this.lastPlayerId = null;
    this.winnerId = null;
    this.biddingState = {
      bids: {},
      highestBid: 0,
      currentPlayerId: playerIds[0],
      passes: 0,
    };
  }

  deal() {
    const deck = shuffleDeck(createDeck());
    let handIndex = 0;
    for (let i = 0; i < 51; i++) {
      this.players[handIndex].hand.push(deck[i]);
      handIndex = (handIndex + 1) % 3;
    }
    this.landlordCards = deck.slice(51);
    this.players.forEach(p => {
      p.hand = sortCards(p.hand);
    });
  }

  bid(playerId, amount) {
    if (playerId !== this.biddingState.currentPlayerId || amount <= this.biddingState.highestBid) {
      return false;
    }
    this.biddingState.bids[playerId] = amount;
    this.biddingState.highestBid = amount;
    this.landlordId = playerId;
    if (amount === 3) {
      this._finalizeBidding();
    } else {
      this._nextBidder();
    }
    return true;
  }

  passBid(playerId) {
    if (playerId !== this.biddingState.currentPlayerId) return false;
    this.biddingState.passes++;
    if (this.biddingState.passes === 3) {
        if(this.landlordId) this._finalizeBidding();
        else this.deal(); // Re-deal if no one bids
    } else {
        this._nextBidder();
        if (this.biddingState.passes === 2 && this.landlordId) {
             this._finalizeBidding();
        }
    }
    return true;
  }
  
  _nextBidder() {
      const currentIndex = this.players.findIndex(p => p.id === this.biddingState.currentPlayerId);
      this.biddingState.currentPlayerId = this.players[(currentIndex + 1) % 3].id;
  }

  _finalizeBidding() {
    const landlord = this.players.find(p => p.id === this.landlordId);
    landlord.hand.push(...this.landlordCards);
    landlord.hand = sortCards(landlord.hand);
    this.currentPlayerId = this.landlordId;
    this.biddingState = null; // Bidding is over
  }
  
  play(playerId, cards) {
    if (playerId !== this.currentPlayerId || this.winnerId) return false;
    const player = this.players.find(p => p.id === playerId);
    const newHand = parseHand(cards);

    if (newHand.type === HandType.INVALID || !canPlay(newHand, this.lastPlayerId === playerId ? null : this.currentHand)) {
        return false;
    }

    const remainingHand = player.hand.filter(c => !cards.some(pc => pc.rank === c.rank && pc.suit === c.suit));
    if (remainingHand.length + cards.length !== player.hand.length) return false;

    player.hand = remainingHand;
    this.currentHand = newHand;
    this.lastPlayerId = playerId;

    if (player.hand.length === 0) {
      this.winnerId = playerId;
      this.currentPlayerId = null;
    } else {
      const currentIndex = this.players.findIndex(p => p.id === this.currentPlayerId);
      this.currentPlayerId = this.players[(currentIndex + 1) % 3].id;
    }
    return true;
  }

  pass(playerId) {
    if (playerId !== this.currentPlayerId || this.lastPlayerId === null || this.lastPlayerId === playerId) return false;
    const currentIndex = this.players.findIndex(p => p.id === this.currentPlayerId);
    this.currentPlayerId = this.players[(currentIndex + 1) % 3].id;
    return true;
  }
}
