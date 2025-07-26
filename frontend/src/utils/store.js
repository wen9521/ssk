// src/utils/store.js (临时诊断版本)
import { create } from 'zustand';
import { produce } from 'immer';
// 注意：我们不再从这里导入任何游戏逻辑函数，以确保最大程度的隔离
// import { createDeck, shuffleDeck, dealCards } from '@/game-logic/deck';
// import { SmartSplit } from '@/game-logic/ai-logic';
// import { calcSSSAllScores, isFoul } from '@/game-logic/thirteen-water-rules';

export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

// ======================= 临时硬编码数据 =======================
// 为了绕过所有动态逻辑，我们在这里直接定义好所有玩家的手牌
const hardcodedHands = {
  player1: [ // 你的手牌 (直接放在尾道让你整理)
    { rank: 'A', suit: 'spades' }, { rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'clubs' },
    { rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'spades' }, { rank: '10', suit: 'hearts' },
    { rank: '9', suit: 'clubs' }, { rank: '8', suit: 'diamonds' }, { rank: '7', suit: 'spades' },
    { rank: '6', suit: 'hearts' }, { rank: '5', suit: 'clubs' }, { rank: '4', suit: 'diamonds' },
    { rank: '3', suit: 'spades' }
  ],
  player2: { // AI 1 (已理好牌)
    head: [{ rank: '2', suit: 'clubs' }, { rank: '2', suit: 'diamonds' }, { rank: 'K', suit: 'hearts' }],
    middle: [{ rank: '5', suit: 'spades' }, { rank: '6', suit: 'spades' }, { rank: '7', suit: 'spades' }, { rank: '8', suit: 'spades' }, { rank: '9', suit: 'spades' }],
    tail: [{ rank: 'J', suit: 'clubs' }, { rank: 'J', suit: 'diamonds' }, { rank: 'J', suit: 'hearts' }, { rank: 'Q', suit: 'clubs' }, { rank: 'Q', suit: 'spades' }]
  },
  player3: { // AI 2 (已理好牌)
    head: [{ rank: '3', suit: 'clubs' }, { rank: '3', suit: 'diamonds' }, { rank: 'A', suit: 'clubs' }],
    middle: [{ rank: '7', suit: 'clubs' }, { rank: '7', suit: 'diamonds' }, { rank: '8', suit: 'hearts' }, { rank: '8', suit: 'clubs' }, { rank: 'K', suit: 'spades' }],
    tail: [{ rank: '9', suit: 'hearts' }, { rank: '10', suit: 'diamonds' }, { rank: 'J', suit: 'diamonds' }, { rank: 'Q', suit: 'hearts' }, { rank: 'K', suit: 'diamonds' }]
  },
  player4: { // AI 3 (已理好牌)
    head: [{ rank: '4', suit: 'clubs' }, { rank: '4', suit: 'hearts' }, { rank: 'A', suit: 'diamonds' }],
    middle: [{ rank: '6', suit: 'clubs' }, { rank: '6', suit: 'diamonds' }, { rank: '10', suit: 'spades' }, { rank: '10', suit: 'clubs' }, { rank: '2', suit: 'spades' }],
    tail: [{ rank: '2', suit: 'hearts' }, { rank: '3', suit: 'hearts' }, { rank: '4', suit: 'hearts' }, { rank: '5', suit: 'hearts' }, { rank: '6', suit: 'hearts' }]
  },
};

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
  
  // ====================== 核心修改：使用绝对安全的 startGame ======================
  startGame: () => {
    set({ stage: STAGES.DEALING });
    setTimeout(() => {
      console.log("--- RUNNING DIAGNOSTIC startGame ---"); // 这条日志将证明新代码已运行
      set(produce(state => {
        state.players.forEach(p => {
          if (p.isAI) {
            const aiHand = hardcodedHands[p.id];
            p.head = aiHand.head;
            p.middle = aiHand.middle;
            p.tail = aiHand.tail;
            p.submitted = true; // AI直接设为已提交
            p.isFoul = false;
          } else {
            // 人类玩家
            p.head = [];
            p.middle = [];
            p.tail = hardcodedHands[p.id]; // 把所有牌都给你，让你整理
            p.isFoul = true; // 初始为倒水状态
            p.submitted = false;
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

  // 下面的函数暂时不会被用到，但保留它们的结构
  updatePlayerHands: (playerId, newHands) => {},
  autoSplitForPlayer: (playerId) => {},
  submitHands: () => {
    alert("比牌功能在诊断模式下被禁用。");
  },
}));

export { useGameStore };
