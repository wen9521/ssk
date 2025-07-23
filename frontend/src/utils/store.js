import { create } from 'zustand';
import { produce } from 'immer';

// 游戏的不同阶段
const STAGES = {
  LOBBY: 'lobby',          // 游戏大厅
  PLAYING: 'playing',      // 游戏中，理牌
  SUBMITTED: 'submitted',  // 本地玩家已提交牌，等待其他玩家
  FINISHED: 'finished',    // 所有玩家出牌，结算完成
};

const useGameStore = create((set) => ({
  // --- 状态 (State) ---
  stage: STAGES.PLAYING, // 初始阶段设为游戏，方便调试
  players: [
    { id: 'player1', name: '我', cards: [], isReady: false },
    { id: 'player2', name: '电脑 A', cards: [], isReady: true },
    { id: 'player3', name: '电脑 B', cards: [], isReady: true },
    { id: 'player4', name: '电脑 C', cards: [], isReady: true },
  ],
  myCards: [], // 本地玩家的13张手牌
  finalResults: null, // { scores: { player1: 10, ... }, details: [...] }

  // --- 操作 (Actions) ---

  // 设置游戏阶段
  setStage: (newStage) => set({ stage: newStage }),

  // 开始新一局，发牌
  dealNewRound: (shuffledDecks) => set(
    produce((state) => {
      state.stage = STAGES.PLAYING;
      state.finalResults = null;
      state.players.forEach((player, index) => {
        player.cards = shuffledDecks[index];
        player.isReady = player.id.startsWith('computer'); // 电脑默认准备好
      });
      state.myCards = shuffledDecks[0];
    })
  ),

  // 玩家提交牌组
  submitMyHand: (sortedHand) => set(
    produce((state) => {
      // 在这里可以添加调用后端API的逻辑
      // 为简化，我们先直接进入结算阶段
      console.log("提交的牌组:", sortedHand);
      state.stage = STAGES.SUBMITTED;
      state.players[0].isReady = true;

      // --- 模拟后端计算 ---
      // 在真实应用中，这里会是一个 fetch 调用
      // 然后在 .then() 中调用 setFinalResults
    })
  ),

  // 设置最终结算结果
  setFinalResults: (results) => set(
    produce((state) => {
      state.finalResults = results;
      state.stage = STAGES.FINISHED;
    })
  ),

}));

export { useGameStore, STAGES };
