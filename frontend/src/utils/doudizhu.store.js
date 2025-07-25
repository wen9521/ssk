// frontend/src/utils/doudizhu.store.js
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck } from '@/game-logic/deck';
import { JokerRanks, parseHand, canPlay, valueMap } from '@/game-logic/doudizhu.rules.js';
import { decideBid, decidePlay } from '@/game-logic/doudizhu.ai.js';

export const DoudizhuStage = { BIDDING: 'BIDDING', PLAYING: 'PLAYING', FINISHED: 'FINISHED' };

const createDoudizhuDeck = () => {
    const standardDeck = createDeck();
    standardDeck.push({ rank: JokerRanks.BLACK_JOKER, suit: 'joker' });
    standardDeck.push({ rank: JokerRanks.RED_JOKER, suit: 'joker' });
    return standardDeck;
};

const getNextPlayerId = (currentId) => {
  const numId = parseInt(currentId.replace('player', ''), 10);
  const nextNum = numId === 3 ? 1 : numId + 1;
  return `player${nextNum}`;
};

const sortHand = (hand) => {
    if (!Array.isArray(hand)) return [];
    return [...hand].sort((a, b) => valueMap[b.rank] - valueMap[a.rank]);
};

export const useDoudizhuStore = create((set, get) => ({
  stage: DoudizhuStage.BIDDING,
  players: [
    { id: 'player1', name: '你', isAI: false, hand: [] },
    { id: 'player2', name: '电脑A', isAI: true, hand: [] },
    { id: 'player3', name: '电脑B', isAI: true, hand: [] },
  ],
  landlordId: null,
  landlordCards: [],
  currentPlayerId: 'player1',
  currentHandOnTable: null,
  lastPlayerId: null,
  winnerId: null,
  biddingState: { highestBid: 0, highestBidderId: null, passedBidders: [], bidTurn: 0 },

  startGame: () => {
    const fullDeck = createDoudizhuDeck();
    const shuffled = shuffleDeck(fullDeck);
    set({
      stage: DoudizhuStage.BIDDING,
      players: [
        { id: 'player1', name: '你', isAI: false, hand: sortHand(shuffled.slice(0, 17)) },
        { id: 'player2', name: '电脑A', isAI: true, hand: sortHand(shuffled.slice(17, 34)) },
        { id: 'player3', name: '电脑B', isAI: true, hand: sortHand(shuffled.slice(34, 51)) },
      ],
      landlordId: null,
      landlordCards: shuffled.slice(51, 54),
      currentPlayerId: 'player1',
      currentHandOnTable: null,
      lastPlayerId: null,
      winnerId: null,
      biddingState: { highestBid: 0, highestBidderId: null, passedBidders: [], bidTurn: 0 },
    });
  },

  playerBid: (playerId, bid) => {
    const { biddingState } = get();
    if (playerId !== get().currentPlayerId || bid <= biddingState.highestBid) return;
    set(produce(state => {
      state.biddingState.highestBid = bid;
      state.biddingState.highestBidderId = playerId;
      state.biddingState.bidTurn++;
      state.currentPlayerId = getNextPlayerId(playerId);
    }));
    if (bid === 3 || get().biddingState.bidTurn >= get().players.length) {
      get().finalizeBidding();
    } else {
      get().triggerAITurn();
    }
  },

  playerPassBid: (playerId) => {
    if (playerId !== get().currentPlayerId) return;
    set(produce(state => {
      if (!state.biddingState.passedBidders.includes(playerId)) {
        state.biddingState.passedBidders.push(playerId);
      }
      state.biddingState.bidTurn++;
      state.currentPlayerId = getNextPlayerId(playerId);
    }));
    const { biddingState, players } = get();
    if (players.length - biddingState.passedBidders.length === 1 && biddingState.highestBidderId) {
        get().finalizeBidding();
    } else if (biddingState.bidTurn >= players.length) {
        get().finalizeBidding();
    } else {
      get().triggerAITurn();
    }
  },

  finalizeBidding: () => {
    const { highestBidderId } = get().biddingState;
    if (!highestBidderId) { get().startGame(); return; }
    set(produce(state => {
        state.landlordId = highestBidderId;
        state.stage = DoudizhuStage.PLAYING;
        state.currentPlayerId = highestBidderId;
        const landlord = state.players.find(p => p.id === highestBidderId);
        if (landlord) {
            landlord.hand.push(...state.landlordCards);
            landlord.hand = sortHand(landlord.hand);
        }
    }));
  },

  playCards: (playerId, cards) => {
    if (playerId !== get().currentPlayerId) return false;
    const newHand = parseHand(cards);
    const isMyTurnToStart = get().currentPlayerId === get().lastPlayerId || !get().lastPlayerId;
    if (!canPlay(newHand, isMyTurnToStart ? null : get().currentHandOnTable)) {
      if(playerId === 'player1') alert("出牌不符合规则！");
      return false;
    }
    set(produce(state => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
          player.hand = player.hand.filter(cInHand => !cards.find(cToPlay => cToPlay.rank === cInHand.rank && cToPlay.suit === cInHand.suit));
      }
      state.currentHandOnTable = newHand;
      state.lastPlayerId = playerId;
      state.currentPlayerId = getNextPlayerId(playerId);
      if (player && player.hand.length === 0) {
        state.winnerId = playerId;
        state.stage = DoudizhuStage.FINISHED;
      }
    }));
    if (get().stage === DoudizhuStage.PLAYING) get().triggerAITurn();
    return true;
  },

  passTurn: (playerId) => {
    const { currentPlayerId, lastPlayerId } = get();
    if (playerId !== currentPlayerId || !lastPlayerId || currentPlayerId === lastPlayerId) return;
    set(produce(state => {
        state.currentPlayerId = getNextPlayerId(playerId);
        if (state.currentPlayerId === state.lastPlayerId) {
            state.currentHandOnTable = null;
        }
    }));
    if (get().stage === DoudizhuStage.PLAYING) get().triggerAITurn();
  },

  triggerAITurn: () => {
    setTimeout(() => {
      const { stage, currentPlayerId, players, biddingState, currentHandOnTable, lastPlayerId } = get();
      const currentPlayer = players.find(p => p.id === currentPlayerId);
      if (!currentPlayer || !currentPlayer.isAI) return;
      if (stage === DoudizhuStage.BIDDING) {
        const bid = decideBid(currentPlayer.hand, biddingState.highestBid);
        if (bid > biddingState.highestBid && bid > 0) {
          get().playerBid(currentPlayerId, bid);mekashi

print(default_api.read_file(path="frontend/src/game-logic/doudizhu.rules.js"))
print(default_api.read_file(path="frontend/src/game-logic/doudizhu.ai.js"))
mekashi
