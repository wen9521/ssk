// src/store/doudizhuStore.js
import create from 'zustand';
import produce from 'immer';
import { DoudizhuGame } from '../game-logic/doudizhu.rules';

export const DoudizhuStage = {
  BIDDING: 'bidding',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

export const useDoudizhuStore = create((set, get) => ({
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

  startGame: () => {
    const ids = ['p0','p1','p2'];
    const game = new DoudizhuGame(ids, ids[0]);
    game.deal();
    const players = ids.map((id, idx) => ({
      id, name: `玩家${idx+1}`,
      hand: game.players.find(p=>p.id===id).hand,
      isAI: idx !== 0,
    }));
    set({
      game, players,
      stage: DoudizhuStage.BIDDING,
      biddingState: game.biddingState,
      currentPlayerId: game.biddingState.currentPlayerId,
      landlordId: null,
      landlordCards: [],
      currentHandOnTable: null,
      lastPlayerId: null,
      winnerId: null,
    });
  },

  bid: (pid, amt) => {
    const { game } = get();
    if (!game.bid(pid, amt)) return;
    set(produce(s => {
      if (game.biddingState) {
        s.biddingState = game.biddingState;
        s.currentPlayerId = game.biddingState.currentPlayerId;
      } else {
        s.stage = DoudizhuStage.PLAYING;
        s.landlordId = game.landlordId;
        s.landlordCards = game.landlordCards;
        s.currentPlayerId = game.currentPlayerId;
        s.players.forEach(p => {
          p.hand = game.players.find(gp=>gp.id===p.id).hand;
        });
      }
    }));
  },

  passBid: pid => get().bid(pid, 0),

  play: (pid, cards) => {
    const { game } = get();
    if (!game.play(pid, cards)) return false;
    set(produce(s => {
      s.currentHandOnTable = game.currentHand;
      s.lastPlayerId = game.lastPlayerId;
      s.currentPlayerId = game.currentPlayerId;
      s.players.find(p=>p.id===pid).hand =
        game.players.find(gp=>gp.id===pid).hand;
      if (game.winnerId) {
        s.stage = DoudizhuStage.FINISHED;
        s.winnerId = game.winnerId;
      }
    }));
    return true;
  },

  pass: pid => {
    const { game } = get();
    if (!game.pass(pid)) return;
    set({ currentPlayerId: game.currentPlayerId });
  },
}));