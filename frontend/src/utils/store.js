// src/utils/store.js
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck, dealCards } from '@/game-logic/deck';
import { SmartSplit } from '@/game-logic/ai-logic';
import { calcSSSAllScores, isFoul } from '@/game-logic/thirteen-water-rules';

export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

const toCardString = (card) => {
  if (!card || !card.rank || !card.suit) return '';
  const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10' };
  const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
  return `${rankStr}_of_${card.suit}`;
};

const toCardObject = (str) => {
  if (!str) return null;
  const parts = str.split('_of_');
  if (parts.length < 2) return null;
  const rev = { ace: 'A', king: 'K', queen: 'Q', jack: 'J', '10': 'T' };
  const rank = rev[parts[0]] || parts[0].toUpperCase();
  return { rank, suit: parts[1] };
};

const toHandStrings = (hand) => ({
  head: (hand.head || []).map(toCardString),
  middle: (hand.middle || []).map(toCardString),
  tail: (hand.tail || []).map(toCardString)
});

const useGameStore = create((set, get) => ({
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '你', submitted: false, isReady: false, points: 100, isFoul: false, head: [], middle: [], tail: [] },
    { id: 'player2', name: '小明', submitted: false, isReady: true, points: 100, isAI: true, head: [], middle: [], tail: [] },
    { id: 'player3', name: '小红', submitted: false, isReady: true, points: 100, isAI: true, head: [], middle: [], tail: [] },
    { id: 'player4', name: '小刚', submitted: false, isReady: true, points: 100, isAI: true, head: [], middle: [], tail: [] },
  ],

  resetRound: () => set(produce(state => {
    state.stage = STAGES.LOBBY;
    state.players.forEach(p => {
      p.submitted = false;
      p.isReady = !!p.isAI;
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
      
      // ========================== 核心修复点 ==========================
      // 移除错误的 [0] 索引，以获取所有玩家手牌的列表，而不是仅获取第一个玩家的手牌。
      const playerHands = dealCards(shuffled, 13, 4);
      // ===============================================================

      set(produce(state => {
        state.players.forEach((player, index) => {
            const playerHandObjects = playerHands[index]; // 现在 playerHandObjects 是一个包含13张牌的数组
            if (player.isAI) {
                const playerHandStrings = playerHandObjects.map(toCardString); // .map() 现在可以正常工作
                const splitResult = SmartSplit(playerHandStrings)[0];
                
                player.head = splitResult.head.map(toCardObject).filter(Boolean);
                player.middle = splitResult.middle.map(toCardObject).filter(Boolean);
                player.tail = splitResult.tail.map(toCardObject).filter(Boolean);
                player.isFoul = isFoul(splitResult.head, splitResult.middle, splitResult.tail);
                player.submitted = true;
            } else {
                player.head = [];
                player.middle = [];
                player.tail = playerHandObjects;
                player.isFoul = true;
            }
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

  updatePlayerHands: (playerId, newHands) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.head = newHands.head;
      player.middle = newHands.middle;
      player.tail = newHands.tail;
      const handStrings = toHandStrings(newHands);
      player.isFoul = isFoul(handStrings.head, handStrings.middle, handStrings.tail);
    }
  })),
  
  autoSplitForPlayer: (playerId) => set(produce(state => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        const allCards = [
          ...(player.head || []),
          ...(player.middle || []),
          ...(player.tail || [])
        ].map(toCardString);

        if (allCards.length === 13) {
            const splitResult = SmartSplit(allCards)[0];
            if (splitResult) {
              player.head = splitResult.head.map(toCardObject).filter(Boolean);
              player.middle = splitResult.middle.map(toCardObject).filter(Boolean);
              player.tail = splitResult.tail.map(toCardObject).filter(Boolean);
              player.isFoul = isFoul(splitResult.head, splitResult.middle, splitResult.tail);
            }
        }
      }
  })),

  submitHands: () => {
    const { players } = get();
    const me = players.find(p => p.id === 'player1');
    if (me.isFoul) {
      if (!window.confirm("当前牌型为倒水，确定要提交吗？")) return;
    }

    set(produce(state => {
        const player = state.players.find(p => p.id === 'player1');
        if (player) player.submitted = true;
    }));

    const allSubmitted = get().players.every(p => p.submitted);
    if (allSubmitted) {
        set({ stage: STAGES.SUBMITTING });
        setTimeout(() => {
          const handsForScoring = get().players.map(p => ({
            ...toHandStrings(p),
            isFoul: p.isFoul
          }));
          const scoresArray = calcSSSAllScores(handsForScoring);
          set(produce(state => {
            state.players.forEach((p, index) => {
              if (scoresArray[index]) {
                const resultData = scoresArray[index];
                p.score = resultData.totalScore;
                p.points += resultData.totalScore;
                p.handDetails = resultData.details;
              }
            });
            state.stage = STAGES.FINISHED;
          }));
        }, 1500);
    }
  },
}));

export { useGameStore };
