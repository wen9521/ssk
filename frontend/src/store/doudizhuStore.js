import create from 'zustand';
import { produce } from 'immer';
import {
    DoudizhuGame,
    DoudizhuStage,
    parseHand,
    canPlay
} from '../game-logic'; // 确保从新的 game-logic/index.js 或 doudizhu.rules.js 导出

// 辅助函数，从游戏实例中提取扁平化的状态
const getGameState = (game) => ({
  stage: game.stage,
  players: game.players,
  landlordId: game.landlordId,
  landlordCards: game.landlordCards,
  currentPlayerId: game.currentPlayerId,
  currentHandOnTable: game.currentHandOnTable,
  lastPlayerId: game.lastPlayerId,
  biddingState: game.biddingState,
  winnerId: game.winnerId,
});

export const useDoudizhuStore = create((set, get) => ({
  // --- State ---
  stage: DoudizhuStage.IDLE,
  players: [],
  landlordId: null,
  landlordCards: [],
  currentPlayerId: null,
  currentHandOnTable: null,
  lastPlayerId: null,
  biddingState: null,
  winnerId: null,
  _gameInstance: null, // 内部保留对游戏实例的引用

  // --- Actions ---
  startGame: () => set(() => {
    // 假设玩家 ID 是固定的，'player-0' 是人类玩家
    const game = new DoudizhuGame(['player-0', 'player-1', 'player-2'], 'player-0');
    return {
      _gameInstance: game,
      ...getGameState(game),
    };
  }),

  bid: (playerId, score) => set(produce(draft => {
    const game = get()._gameInstance;
    if (game) {
      game.bid(playerId, score);
      Object.assign(draft, getGameState(game));
    }
  })),
  
  passBid: (playerId) => set(produce(draft => {
    const game = get()._gameInstance;
    if (game) {
      game.passBid(playerId);
      Object.assign(draft, getGameState(game));
    }
  })),

  play: (playerId, cards) => set(produce(draft => {
    const game = get()._gameInstance;
    if (game) {
      const parsedPlay = parseHand(cards);
      if (canPlay(parsedPlay, game.currentHandOnTable)) {
         game.play(playerId, cards);
         Object.assign(draft, getGameState(game));
      } else {
        console.error("出牌不合法!");
        // 可选：在这里设置一个错误状态，让UI显示提示
      }
    }
  })),

  pass: (playerId) => set(produce(draft => {
    const game = get()._gameInstance;
    if (game) {
      game.pass(playerId);
      Object.assign(draft, getGameState(game));
    }
  })),
}));