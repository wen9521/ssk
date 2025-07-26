// src/store/doudizhuStore.js
// Zustand store for Dou-Di-Zhu game state

import { create } from 'zustand';
import { produce } from 'immer';                      // ← 改为命名导入
import { DoudizhuGame, DoudizhuStage } from '../game-logic';  

export const useDoudizhuStore = create((set) => ({
  // 当前游戏阶段
  stage: DoudizhuStage.IDLE,

  // 游戏实例
  game: null,

  // 初始化游戏：传入玩家 ID 列表和人类玩家 ID
  initGame: (playerIds, humanPlayerId) =>
    set(produce((draft) => {
      draft.game = new DoudizhuGame(playerIds, humanPlayerId);
      draft.stage = DoudizhuStage.DEAL;
      draft.currentPlayer = draft.game.currentPlayer;
      draft.lastPlay = null;
    })),

  // 玩家出牌
  playCards: (playerId, cards) =>
    set(produce((draft) => {
      const { lastPlay, currentPlayer } = draft.game.playCards(playerId, cards);
      draft.lastPlay = lastPlay;
      draft.currentPlayer = currentPlayer;
      draft.stage = DoudizhuStage.PLAY;
    })),

  // 玩家不出（过）
  pass: (playerId) =>
    set(produce((draft) => {
      const { currentPlayer } = draft.game.pass(playerId);
      draft.currentPlayer = currentPlayer;
      draft.stage = DoudizhuStage.PLAY;
    })),

  // 重置游戏状态
  reset: () =>
    set(() => ({
      game: null,
      stage: DoudizhuStage.IDLE,
      currentPlayer: null,
      lastPlay: null
    }))
}));