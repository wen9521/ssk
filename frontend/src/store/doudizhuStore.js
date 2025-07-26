import { create } from 'zustand';
import { produce } from 'immer';
import {
  createDeck,
  shuffleDeck,
  sortCards,
  DoudizhuBid,
  DoudizhuGame,
  AIPlayer,
} from '../game-logic';

export const DoudizhuStage = {
  BIDDING: 'bidding',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

const createInitialState = () => ({
  stage: DoudizhuStage.BIDDING,
  players: [],
  landlordId: null,
  landlordCards: [],
  currentPlayerId: null,
  currentHandOnTable: null,
  lastPlayerId: null,
  winnerId: null,
  biddingState: null,
  game: null,
});

export const useDoudizhuStore = create((set, get) => ({
  ...createInitialState(),

  startGame: () => {
    const playerIds = ['player1', 'player2', 'player3'];
    const humanPlayerId = 'player1';
    const aiPlayerIds = ['player2', 'player3'];
    
    const game = new DoudizhuGame(playerIds, humanPlayerId);
    game.deal();

    const players = playerIds.map(id => {
      const p = game.players.find(p => p.id === id);
      return { id, name: `玩家 ${id.slice(-1)}`, hand: p.hand, isAI: aiPlayerIds.includes(id) };
    });

    set({
      ...createInitialState(),
      game,
      players,
      stage: DoudizhuStage.BIDDING,
      biddingState: game.biddingState,
      currentPlayerId: game.biddingState.currentPlayerId,
    });
  },

  playerBid: (playerId, bid) => {
    const { game } = get();
    if (game.bid(playerId, bid)) {
      set(produce(state => {
        state.biddingState = { ...game.biddingState };
        if (game.landlordId) {
          state.stage = DoudizhuStage.PLAYING;
          state.landlordId = game.landlordId;
          state.landlordCards = game.landlordCards;
          state.currentPlayerId = game.landlordId;
          state.players.forEach(p => {
            const gamePlayer = game.players.find(gp => gp.id === p.id);
            if (gamePlayer) p.hand = gamePlayer.hand;
          });
        } else {
          state.currentPlayerId = game.biddingState.currentPlayerId;
        }
      }));
    }
  },

  playerPassBid: (playerId) => {
    const { game } = get();
    if (game.passBid(playerId)) {
      set(produce(state => {
        state.biddingState = { ...game.biddingState };
        if (game.landlordId) {
          state.stage = DoudizhuStage.PLAYING;
          state.landlordId = game.landlordId;
          state.landlordCards = game.landlordCards;
          state.currentPlayerId = game.landlordId;
          state.players.forEach(p => {
            const gamePlayer = game.players.find(gp => gp.id === p.id);
            if (gamePlayer) p.hand = gamePlayer.hand;
          });
        } else {
          state.currentPlayerId = game.biddingState.currentPlayerId;
        }
      }));
    }
  },
  
  playCards: (playerId, cards) => {
    const { game } = get();
    if (game.play(playerId, cards)) {
      set(produce(state => {
        const player = state.players.find(p => p.id === playerId);
        const gamePlayer = game.players.find(gp => gp.id === playerId);
        if (player && gamePlayer) player.hand = gamePlayer.hand;
        
        state.currentHandOnTable = game.currentHand;
        state.lastPlayerId = game.lastPlayerId;
        
        if (game.winnerId) {
          state.stage = DoudizhuStage.FINISHED;
          state.winnerId = game.winnerId;
        } else {
          state.currentPlayerId = game.currentPlayerId;
        }
      }));
      return true;
    }
    return false;
  },

  passTurn: (playerId) => {
    const { game } = get();
    if (game.pass(playerId)) {
      set(produce(state => {
        state.currentPlayerId = game.currentPlayerId;
      }));
    }
  },
}));
