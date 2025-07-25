// frontend/src/utils/eight-cards.store.js
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck, dealCards } from '@/game-logic/deck';

export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

const toCardObject = (card) => ({ rank: card.rank, suit: card.suit });

export const useEightCardsStore = create((set, get) => ({
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '你', isReady: false, points: 100, isAI: false },
    { id: 'player2', name: 'AI Alpha', isReady: true, points: 100, isAI: true },
    { id: 'player3', name: 'AI Beta', isReady: true, points: 100, isAI: true },
    { id: 'player4', name: 'AI Gamma', isReady: true, points: 100, isAI: true },
    { id: 'player5', name: 'AI Delta', isReady: true, points: 100, isAI: true },
    { id: 'player6', name: 'AI Epsilon', isReady: true, points: 100, isAI: true },
  ],

  resetRound: () => set(produce(state => {
    state.stage = STAGES.LOBBY;
    state.players.forEach(p => {
      p.isReady = !!p.isAI;
      p.submitted = false;
      p.isFoul = false;
      p.head = [];
      p.middle = [];
      p.tail = [];
      delete p.score;
      delete p.handDetails;
    });
  })),

  startGame: () => {
    set({ stage: STAGES.DEALING });
    setTimeout(() => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      
      // --- 核心修复：正确解构 dealCards 的返回结果 ---
      const [playerHands] = [dealCards(shuffled, 8, 6)]; // playerHands 现在是 [[...], [...], ... , remainingDeck]
      
      set(produce(state => {
        state.players.forEach((player, index) => {
          // 只取前 6 份手牌
          const playerHand = playerHands[index]; 
          
          const randomHand = shuffleDeck(playerHand);
          
          player.head = randomHand.slice(0, 2).map(toCardObject);
          player.middle = randomHand.slice(2, 5).map(toCardObject);
          player.tail = randomHand.slice(5, 8).map(toCardObject);

          player.isFoul = false; 
        });
        state.stage = STAGES.PLAYING;
      }));
    }, 500);
  },
  
  setPlayerReady: (playerId) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player && state.stage === STAGES.LOBBY) {
      player.isReady = !player.isReady;
    }
    const allReady = state.players.every(p => p.isReady);
    if (allReady && state.stage === STAGES.LOBBY) {
      get().startGame();
    }
  })),

  updatePlayerHands: (playerId, newHands) => {},
  submitHands: () => {
      alert("比牌逻辑尚未实现！");
  },
}));
