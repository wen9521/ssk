// src/utils/store.js
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck, dealCards } from '@/game-logic/deck';
import { SmartSplit } from '@/game-logic/ai-logic';
// 1. 导入新的规则文件
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
  // ... (初始状态不变) ...
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '你', submitted: false, isReady: false, points: 100, isFoul: false },
    { id: 'player2', name: '小明', submitted: false, isReady: true, points: 100, isAI: true },
    { id: 'player3', name: '小红', submitted: false, isReady: true, points: 100, isAI: true },
    { id: 'player4', name: '小刚', submitted: false, isReady: true, points: 100, isAI: true },
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
    // ... (此函数不变) ...
    set({ stage: STAGES.DEALING });
    setTimeout(() => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const hands = dealCards(shuffled, 13, 4);
      set(produce(state => {
        state.players.forEach((player, index) => {
            const playerHandObjects = hands[index];
            if (player.isAI) {
                const playerHandStrings = playerHandObjects.map(toCardString);
                const splitResult = SmartSplit(playerHandStrings)[0];
                player.head = splitResult.head.map(toCardObject).filter(Boolean);
                player.middle = splitResult.middle.map(toCardObject).filter(Boolean);
                player.tail = splitResult.tail.map(toCardObject).filter(Boolean);
            } else {
                // 将所有牌默认放入尾道，让玩家自己理牌
                player.head = [];
                player.middle = [];
                player.tail = playerHandObjects;
            }
            player.isFoul = true; // 初始状态牌数不对，肯定是倒水
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

  // 2. 增强 updatePlayerHands
  updatePlayerHands: (playerId, newHands) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.head = newHands.head;
      player.middle = newHands.middle;
      player.tail = newHands.tail;
      const handStrings = toHandStrings(newHands);
      // 使用新的 isFoul 函数进行实时判断
      player.isFoul = isFoul(handStrings.head, handStrings.middle, handStrings.tail);
    }
  })),
  
  autoSplitForPlayer: (playerId) => set(produce(state => {
      const player = state.players.find(p => p.id === playerId);
      if (player && player.head && player.middle && player.tail) {
        const allCards = [ ...player.head, ...player.middle, ...player.tail ].map(toCardString);
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

  // 3. 增强 submitHands
  submitHands: () => {
    const { players } = get();
    const me = players.find(p => p.id === 'player1');
    if (me.isFoul) {
      if (!window.confirm("当前牌型为倒水，确定要提交吗？")) return;
    }

    set(produce(state => {
        const player = state.players.find(p => p.id === 'player1');
        player.submitted = true;
    }));

    set({ stage: STAGES.SUBMITTING });
    
    // AI 玩家自动提交
    set(produce(state => {
      state.players.forEach(p => {
        if(p.isAI) p.submitted = true;
      });
    }));

    setTimeout(() => {
      const handsForScoring = players.map(p => ({
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
  },
}));

export { useGameStore };
