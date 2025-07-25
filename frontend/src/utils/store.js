// frontend/src/utils/store.js

import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { SmartSplit } from '../game-logic/ai-logic';
import { calcSSSAllScores, isFoul } from '../game-logic/thirteen-water-rules';

// --- 核心改动：更新游戏阶段 ---
export const STAGES = {
  LOBBY: 'lobby',          // 等待玩家准备
  DEALING: 'dealing',      // 发牌与理牌中
  PLAYING: 'playing',      // 理牌完成，可调整牌型
  SUBMITTING: 'submitting',// 提交中
  FINISHED: 'finished',    // 结算完成
};

// --- 辅助函数：转换卡牌格式 ---
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
    { id: 'player1', name: '我', submitted: false, isReady: false, points: 0 },
    { id: 'player2', name: '电脑 A', submitted: false, isReady: true, points: 0, isAI: true },
    { id: 'player3', name: '电脑 B', submitted: false, isReady: true, points: 0, isAI: true },
    { id: 'player4', name: '电脑 C', submitted: false, isReady: true, points: 0, isAI: true },
  ],
  finalResults: null,
  error: null,

  // --- 操作 (Actions) ---

  setStage: (newStage) => set({ stage: newStage }),

  // 重置牌局，回到准备阶段
  resetRound: () => set(
    produce((state) => {
      state.stage = STAGES.LOBBY;
      state.finalResults = null;
      state.error = null;
      state.players.forEach((player) => {
        player.submitted = false;
        player.isReady = !!player.isAI; // AI 自动准备
        delete player.head;
        delete player.middle;
        delete player.tail;
        delete player.score;
        delete player.isFoul;
      });
    })
  ),
  
  // --- 新增核心 Action: 开始游戏（发牌 + 自动理牌） ---
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
          
          let sortedHand;
          if (player.isAI || player.id !== 'player1') {
            // AI 和其他玩家自动理牌
            sortedHand = SmartSplit(playerHandStrings)[0];
          } else {
            // 为真人玩家也进行一次初始智能理牌
            sortedHand = SmartSplit(playerHandStrings)[0];
          }

          player.head = sortedHand.head.map(toCardObject);
          player.middle = sortedHand.middle.map(toCardObject);
          player.tail = sortedHand.tail.map(toCardObject);
        });
        state.stage = STAGES.PLAYING;
      }));
    }, 500); // 模拟发牌动画延迟
  },
  
  // 玩家点击准备
  setPlayerReady: (playerId) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
    }
    // 检查是否所有玩家都准备好了
    const allReady = state.players.every(p => p.isReady);
    if (allReady) {
      get().startGame();
    }
  })),

  // 更新玩家牌墩（用于拖拽交换）
  updatePlayerHands: (playerId, newHands) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if(player) {
      player.head = newHands.head;
      player.middle = newHands.middle;
      player.tail = newHands.tail;
    }
  })),

  // 提交比牌
  submitHands: () => {
    const { players } = get();
    set({ stage: STAGES.SUBMITTING });
    
    // 立即更新所有玩家为 submitted 状态
    set(produce(state => {
      state.players.forEach(p => p.submitted = true);
    }));

    setTimeout(() => {
      const handsForScoring = players.map(p => toHandStrings(p));
      const scoresArray = calcSSSAllScores(handsForScoring);

      const finalResults = {
        scores: players.map((p, index) => {
          const handStrings = handsForScoring[index];
          return {
            id: p.id,
            totalScore: scoresArray[index],
            isFoul: isFoul(handStrings.head, handStrings.middle, handStrings.tail),
            hands: { head: p.head, middle: p.middle, tail: p.tail },
          };
        }),
      };

      set(produce(state => {
        state.finalResults = finalResults;
        state.players.forEach(p => {
            const resultData = finalResults.scores.find(r => r.id === p.id);
            if(resultData) {
                p.score = resultData.totalScore;
                p.isFoul = resultData.isFoul;
                // 累加总分
                p.points = (p.points || 0) + resultData.totalScore;
            }
        });
        state.stage = STAGES.FINISHED;
      }));
    }, 1500);
  },
}));

export { useGameStore };
