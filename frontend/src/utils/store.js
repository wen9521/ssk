// frontend/src/utils/store.js (功能增强版)

import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { SmartSplit } from '../game-logic/ai-logic';
import { calcSSSAllScores, isFoul, compareHands, handRank } from '../game-logic/thirteen-water-rules';

export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

// --- 辅助函数 ---
const toCardString = (card) => {
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10'};
    const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
    return `${rankStr}_of_${card.suit}`;
};
const toCardObject = (str) => {
    const parts = str.split('_of_');
    const rev = { ace:'A', king:'K', queen:'Q', jack:'J', '10':'T' };
    const rank = rev[parts[0]] || parts[0].toUpperCase();
    return { rank, suit: parts[1] };
};
const toHandStrings = (hand) => ({
  head: (hand.head || []).map(toCardString),
  middle: (hand.middle || []).map(toCardString),
  tail: (hand.tail || []).map(toCardString)
});

const useGameStore = create((set, get) => ({
  // --- 状态 (State) ---
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '我', submitted: false, isReady: false, points: 0, isFoul: false },
    { id: 'player2', name: '电脑 A', submitted: false, isReady: true, points: 0, isAI: true },
    { id: 'player3', name: '电脑 B', submitted: false, isReady: true, points: 0, isAI: true },
    { id: 'player4', name: '电脑 C', submitted: false, isReady: true, points: 0, isAI: true },
  ],
  finalResults: null,
  error: null,

  // --- 操作 (Actions) ---

  setStage: (newStage) => set({ stage: newStage }),

  resetRound: () => set(
    produce((state) => {
      state.stage = STAGES.LOBBY;
      state.finalResults = null;
      state.error = null;
      state.players.forEach((player) => {
        player.submitted = false;
        player.isReady = !!player.isAI;
        player.isFoul = false;
        delete player.head;
        delete player.middle;
        delete player.tail;
        delete player.score;
        delete player.handDetails;
      });
    })
  ),
  
  startGame: () => {
    set({ stage: STAGES.DEALING });

    setTimeout(() => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const hands = dealCards(shuffled, 13, 4);

      set(produce(state => {
        state.players.forEach((player, index) => {
          const playerHandObjects = hands[index];
          const playerHandStrings = playerHandObjects.map(toCardString);
          
          const sortedHand = SmartSplit(playerHandStrings)[0];

          player.head = sortedHand.head.map(toCardObject);
          player.middle = sortedHand.middle.map(toCardObject);
          player.tail = sortedHand.tail.map(toCardObject);
          player.isFoul = isFoul(sortedHand.head, sortedHand.middle, sortedHand.tail);
        });
        state.stage = STAGES.PLAYING;
      }));
    }, 500);
  },
  
  setPlayerReady: (playerId) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
    }
    const allReady = state.players.every(p => p.isReady);
    if (allReady) {
      get().startGame();
    }
  })),

  updatePlayerHands: (playerId, newHands) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if(player) {
      player.head = newHands.head;
      player.middle = newHands.middle;
      player.tail = newHands.tail;
      // 实时验证是否倒水
      const handStrings = toHandStrings(newHands);
      player.isFoul = isFoul(handStrings.head, handStrings.middle, handStrings.tail);
    }
  })),

  submitHands: () => {
    const { players } = get();
    // 检查我方是否倒水
    const me = players.find(p => p.id === 'player1');
    if (me.isFoul) {
        if (!window.confirm("当前牌型为倒水，确定要提交吗？")) {
            return;
        }
    }

    set({ stage: STAGES.SUBMITTING });
    
    set(produce(state => {
      state.players.forEach(p => p.submitted = true);
    }));

    setTimeout(() => {
      const handsForScoring = players.map(p => toHandStrings(p));
      const scoresArray = calcSSSAllScores(handsForScoring);

      set(produce(state => {
        state.players.forEach((p, index) => {
            const resultData = scoresArray[index];
            p.score = resultData.totalScore;
            p.isFoul = resultData.isFoul;
            p.points = (p.points || 0) + resultData.totalScore;
            p.handDetails = resultData.details;
        });
        state.stage = STAGES.FINISHED;
      }));
    }, 1500);
  },
}));

export { useGameStore };
