// frontend/src/utils/store.js

import { create } from 'zustand';
import { produce } from 'immer';

// 游戏的不同阶段
const STAGES = {
  LOBBY: 'lobby',          // 游戏大厅
  PLAYING: 'playing',      // 游戏中，理牌
  SUBMITTING: 'submitting', // 提交中，等待后端响应
  SUBMITTED: 'submitted',  // 本地玩家已提交牌，等待其他玩家
  FINISHED: 'finished',    // 所有玩家出牌，结算完成
};

// 后端 API 地址 (注意：这个地址仅为示例，您需要替换为实际可用的后端地址)
const API_URL = 'https://your-backend-api-url.com/api/v1/thirteen-water/calculate';

const useGameStore = create((set, get) => ({
  // --- 状态 (State) ---
  stage: STAGES.PLAYING,
  players: [
    { id: 'player1', name: '我', cards13: [], submitted: false, points: 0 },
    { id: 'player2', name: '电脑 A', cards13: [], submitted: false, points: 0, isAI: true },
    { id: 'player3', name: '电脑 B', cards13: [], submitted: false, points: 0, isAI: true },
    { id: 'player4', name: '电脑 C', cards13: [], submitted: false, points: 0, isAI: true },
  ],
  finalResults: null,
  error: null, // 用于存储错误信息

  // --- 操作 (Actions) ---

  setStage: (newStage) => set({ stage: newStage }),

  dealNewRound: (shuffledDecks) => set(
    produce((state) => {
      state.stage = STAGES.PLAYING;
      state.finalResults = null;
      state.error = null;
      state.players.forEach((player, index) => {
        player.cards13 = shuffledDecks[index];
        player.submitted = false; // 重置准备状态
        // 清空上一局的牌
        delete player.head;
        delete player.middle;
        delete player.tail;
        delete player.score;
        delete player.isFoul;
      });
    })
  ),

  // *** 新增的 Action ***
  updatePlayerStatus: (playerId, statusUpdate) => set(
    produce((state) => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        Object.assign(player, statusUpdate);
      }
    })
  ),

  setFinalResults: (results) => set(
    produce((state) => {
      state.finalResults = results;
      state.players.forEach(p => {
        const resultData = results.scores.find(r => r.id === p.id);
        if (resultData) {
          p.score = resultData.totalScore;
          p.isFoul = resultData.isFoul;
          p.head = resultData.hands.head;
          p.middle = resultData.hands.middle;
          p.tail = resultData.hands.tail;
        }
        p.submitted = true; // 确保所有玩家都显示已准备
      });
      state.stage = STAGES.FINISHED;
    })
  ),

}));

export { useGameStore, STAGES };
