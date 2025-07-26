// src/game-logic/doudizhu.rules.js (修改后)

/**
 * Dou Dizhu 游戏核心规则与工具函数
 */

// 牌面值映射
export const valueMap = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  '2': 16, // '2' is 16 for sorting purposes
  'BlackJoker': 17,
  'RedJoker': 18
};

// 花色列表
const SUITS = ['♠', '♥', '♣', '♦'];
// 大小王常量
export const JokerRanks = {
    BLACK_JOKER: 'BlackJoker',
    RED_JOKER: 'RedJoker'
};

// 出牌类型枚举
export const HandType = {
  INVALID: 'invalid',
  SINGLE: 'single',
  PAIR: 'pair',
  TRIO: 'trio',
  TRIO_WITH_SINGLE: 'trio_with_single',
  TRIO_WITH_PAIR: 'trio_with_pair',
  STRAIGHT: 'straight',
  STRAIGHT_FLUSH: 'straight_flush', // Although not standard, good to have
  BOMB: 'bomb',
  ROCKET: 'rocket',
  // 新增更多牌型
  SEQUENCE_OF_PAIRS: 'sequence_of_pairs',
  SEQUENCE_OF_TRIOS: 'sequence_of_trios', // 飞机不带翅膀
  SEQUENCE_OF_TRIOS_WITH_SINGLES: 'sequence_of_trios_with_singles', // 飞机带单
  SEQUENCE_OF_TRIOS_WITH_PAIRS: 'sequence_of_trios_with_pairs', // 飞机带对
  FOUR_WITH_TWO_SINGLES: 'four_with_two_singles',
  FOUR_WITH_TWO_PAIRS: 'four_with_two_paids',
};

// 游戏阶段枚举
export const DoudizhuStage = {
  IDLE: 'idle',
  BIDDING: 'bidding',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

function createDeck() {
    const deck = [];
    // Add standard cards
    for (const rank in valueMap) {
        if (rank === JokerRanks.BLACK_JOKER || rank === JokerRanks.RED_JOKER) continue;
        const value = valueMap[rank];
        for (const suit of SUITS) {
            deck.push({ rank, suit, value });
        }
    }
    // Add jokers
    deck.push({ rank: JokerRanks.BLACK_JOKER, suit: 'Joker', value: valueMap[JokerRanks.BLACK_JOKER] });
    deck.push({ rank: JokerRanks.RED_JOKER, suit: 'Joker', value: valueMap[JokerRanks.RED_JOKER] });
    return deck;
}

export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const sortCards = (cards) => {
  return cards.slice().sort((a, b) => a.value - b.value);
};

export function parseHand(cards) {
    if (!cards || cards.length === 0) return { type: HandType.INVALID };

    const counts = cards.reduce((acc, card) => {
        acc[card.rank] = (acc[card.rank] || 0) + 1;
        return acc;
    }, {});

    const ranks = Object.keys(counts).sort((a, b) => valueMap[a] - valueMap[b]);
    const values = ranks.map(r => valueMap[r]);
    const mainValue = values[values.length - 1];

    // Rocket
    if (cards.length === 2 && counts[JokerRanks.BLACK_JOKER] && counts[JokerRanks.RED_JOKER]) {
        return { type: HandType.ROCKET, value: Infinity, length: 2 };
    }
    // Bomb
    if (cards.length === 4 && ranks.length === 1) {
        return { type: HandType.BOMB, value: mainValue, length: 4 };
    }
    // Single
    if (cards.length === 1) {
        return { type: HandType.SINGLE, value: mainValue, length: 1 };
    }
    // Pair
    if (cards.length === 2 && ranks.length === 1) {
        return { type: HandType.PAIR, value: mainValue, length: 2 };
    }
    // Trio
    if (cards.length === 3 && ranks.length === 1) {
        return { type: HandType.TRIO, value: mainValue, length: 3 };
    }
    // Trio with single
    if (cards.length === 4 && ranks.length === 2 && Object.values(counts).includes(3)) {
        const trioRank = ranks.find(r => counts[r] === 3);
        return { type: HandType.TRIO_WITH_SINGLE, value: valueMap[trioRank], length: 4 };
    }
    // Trio with pair
    if (cards.length === 5 && ranks.length === 2 && Object.values(counts).includes(3)) {
        const trioRank = ranks.find(r => counts[r] === 3);
        return { type: HandType.TRIO_WITH_PAIR, value: valueMap[trioRank], length: 5 };
    }
    
    // Straight (顺子)
    const isStraight = (vals) => {
        if (vals.includes(valueMap['2']) || vals.includes(valueMap[JokerRanks.BLACK_JOKER])) return false;
        for (let i = 0; i < vals.length - 1; i++) {
            if (vals[i+1] - vals[i] !== 1) return false;
        }
        return true;
    }
    if (cards.length >= 5 && ranks.length === cards.length && isStraight(values)) {
        return { type: HandType.STRAIGHT, value: mainValue, length: cards.length };
    }
    
    // Sequence of pairs (连对)
    const isSeqOfPairs = (vals) => {
      if (vals.length < 3) return false;
      if (vals.includes(valueMap['2']) || vals.includes(valueMap[JokerRanks.BLACK_JOKER])) return false;
      for (let i = 0; i < vals.length - 1; i++) {
          if (vals[i+1] - vals[i] !== 1) return false;
      }
      return true;
    }
    if (cards.length >= 6 && cards.length % 2 === 0 && ranks.length === cards.length / 2 && Object.values(counts).every(c => c === 2) && isSeqOfPairs(values)) {
      return { type: HandType.SEQUENCE_OF_PAIRS, value: mainValue, length: ranks.length };
    }

    // TODO: Add other hand types like airplanes, four with two, etc.
    
    return { type: HandType.INVALID, value: 0, length: 0 };
}

export function canPlay(newPlay, lastPlay) {
    if (!lastPlay) { // First player to play
        return newPlay.type !== HandType.INVALID;
    }

    // Rocket can beat anything
    if (newPlay.type === HandType.ROCKET) return true;

    // Bomb can beat anything except a bigger bomb or rocket
    if (newPlay.type === HandType.BOMB) {
        if (lastPlay.type === HandType.ROCKET) return false;
        if (lastPlay.type === HandType.BOMB) return newPlay.value > lastPlay.value;
        return true;
    }
    
    // Must play the same type and length
    if (newPlay.type !== lastPlay.type || newPlay.length !== lastPlay.length) {
        return false;
    }

    // Compare values for same type
    return newPlay.value > lastPlay.value;
}

export class DoudizhuGame {
  constructor(playerIds, humanPlayerId) {
    this.players = playerIds.map((id, index) => ({
      id,
      name: id === humanPlayerId ? '你' : `AI-${index+1}`,
      isAI: id !== humanPlayerId,
      hand: [],
    }));
    this.stage = DoudizhuStage.IDLE;
    this.landlordId = null;
    this.landlordCards = [];
    this.currentPlayerId = null;
    this.currentHandOnTable = null;
    this.lastPlayerId = null;
    this.winnerId = null;
    this.passCount = 0;
    
    this.biddingState = {
        highestBid: 0,
        highestBidder: null,
        bids: {},
        currentPlayerId: null,
        turn: 0
    };
    
    this.deal();
  }

  deal() {
    const deck = shuffleDeck(createDeck());
    this.landlordCards = deck.slice(0, 3);
    const playerDeck = deck.slice(3);

    this.players.forEach((p, i) => {
      p.hand = sortCards(playerDeck.slice(i * 17, (i + 1) * 17));
    });

    this.stage = DoudizhuStage.BIDDING;
    this.biddingState.currentPlayerId = this.players[Math.floor(Math.random() * 3)].id;
  }
  
  bid(playerId, score) {
      if (this.stage !== DoudizhuStage.BIDDING || playerId !== this.biddingState.currentPlayerId) return;
      if (score <= this.biddingState.highestBid || score < 1 || score > 3) return;

      this.biddingState.bids[playerId] = score;
      this.biddingState.highestBid = score;
      this.biddingState.highestBidder = playerId;
      this.biddingState.turn++;
      this.nextBidder();
  }

  passBid(playerId) {
      if (this.stage !== DoudizhuStage.BIDDING || playerId !== this.biddingState.currentPlayerId) return;
      this.biddingState.bids[playerId] = 'pass';
      this.biddingState.turn++;
      this.nextBidder();
  }

  nextBidder() {
      if (this.biddingState.highestBid === 3 || this.biddingState.turn === this.players.length) {
          this.endBidding();
          return;
      }
      const currentIndex = this.players.findIndex(p => p.id === this.biddingState.currentPlayerId);
      this.biddingState.currentPlayerId = this.players[(currentIndex + 1) % this.players.length].id;
  }
  
  endBidding() {
    if (this.biddingState.highestBidder) {
        this.landlordId = this.biddingState.highestBidder;
        const landlord = this.players.find(p => p.id === this.landlordId);
        landlord.hand = sortCards([...landlord.hand, ...this.landlordCards]);
        this.currentPlayerId = this.landlordId;
        this.stage = DoudizhuStage.PLAYING;
    } else {
        // Everyone passed, redeal
        this.deal();
    }
  }

  play(playerId, cards) {
      if (this.stage !== DoudizhuStage.PLAYING || playerId !== this.currentPlayerId) return;
      const player = this.players.find(p => p.id === playerId);
      
      // Remove cards from hand
      player.hand = player.hand.filter(handCard => 
          !cards.some(playCard => playCard.rank === handCard.rank && playCard.suit === handCard.suit)
      );

      this.currentHandOnTable = parseHand(cards);
      this.lastPlayerId = playerId;
      this.passCount = 0;
      
      if (player.hand.length === 0) {
          this.winnerId = playerId;
          this.stage = DoudizhuStage.FINISHED;
      } else {
          this.nextPlayer();
      }
  }

  pass(playerId) {
      if (this.stage !== DoudizhuStage.PLAYING || playerId !== this.currentPlayerId) return;
      // You can't pass if you are starting a new round
      if (this.lastPlayerId === null || this.lastPlayerId === playerId) return;

      this.passCount++;
      // If two players pass, the last player who played gets to start a new round
      if (this.passCount === 2) {
          this.currentHandOnTable = null;
          this.lastPlayerId = null;
          this.passCount = 0;
      }
      this.nextPlayer();
  }
  
  nextPlayer() {
      const currentIndex = this.players.findIndex(p => p.id === this.currentPlayerId);
      this.currentPlayerId = this.players[(currentIndex + 1) % this.players.length].id;
  }
}